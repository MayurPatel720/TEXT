"""
GPU Manager Service
Manages GPU instance lifecycle and job queue processing
"""

import os
import asyncio
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import httpx


# Configuration
VASTAI_API_KEY = os.getenv("VASTAI_API_KEY", "")
VASTAI_INSTANCE_ID = os.getenv("VASTAI_INSTANCE_ID", "")
MONGODB_URI = os.getenv("MONGODB_URI", "")
API_SECRET = os.getenv("API_SECRET", "")
WEBHOOK_BASE_URL = os.getenv("WEBHOOK_BASE_URL", "")

# Timing settings
IDLE_TIMEOUT_MINUTES = int(os.getenv("IDLE_TIMEOUT_MINUTES", "10"))
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "30"))
STARTUP_WAIT_SECONDS = int(os.getenv("STARTUP_WAIT_SECONDS", "120"))


class GPUManager:
    """
    Manages GPU instance and job queue.
    - Starts GPU when jobs are pending
    - Stops GPU after idle timeout
    - Processes jobs from queue
    """
    
    VASTAI_API_URL = "https://console.vast.ai/api/v0"
    
    def __init__(self):
        self.api_key = VASTAI_API_KEY
        self.instance_id = VASTAI_INSTANCE_ID
        self.last_job_time: Optional[datetime] = None
        self.worker_url: Optional[str] = None
        self._running = False
    
    @property
    def headers(self) -> Dict[str, str]:
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
    
    async def get_instance_status(self) -> Dict[str, Any]:
        """Get current instance status from Vast.ai"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.VASTAI_API_URL}/instances/",
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            
            instances = response.json().get("instances", [])
            for inst in instances:
                if str(inst.get("id")) == str(self.instance_id):
                    return {
                        "id": inst["id"],
                        "status": inst.get("actual_status", "unknown"),
                        "ip": inst.get("public_ipaddr"),
                        "ports": inst.get("ports", {}),
                        "gpu": inst.get("gpu_name"),
                        "cost_per_hour": inst.get("dph_total", 0),
                    }
            
            return {"status": "not_found"}
    
    async def start_instance(self) -> bool:
        """Start the GPU instance"""
        print(f"🚀 Starting GPU instance {self.instance_id}...")
        
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.VASTAI_API_URL}/instances/{self.instance_id}/",
                headers=self.headers,
                json={"state": "running"},
                timeout=30.0
            )
            
            if response.status_code in (200, 202):
                print("✅ Instance start requested")
                return True
            
            print(f"❌ Failed to start: {response.status_code}")
            return False
    
    async def stop_instance(self) -> bool:
        """Stop the GPU instance (keeps storage)"""
        print(f"⏹️ Stopping GPU instance {self.instance_id}...")
        
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.VASTAI_API_URL}/instances/{self.instance_id}/",
                headers=self.headers,
                json={"state": "stopped"},
                timeout=30.0
            )
            
            if response.status_code in (200, 202):
                print("✅ Instance stop requested")
                self.worker_url = None
                return True
            
            print(f"❌ Failed to stop: {response.status_code}")
            return False
    
    async def wait_for_worker(self, timeout: int = STARTUP_WAIT_SECONDS) -> bool:
        """Wait for worker to be ready after instance starts"""
        print("⏳ Waiting for worker to initialize...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            status = await self.get_instance_status()
            
            if status.get("status") == "running" and status.get("ip"):
                # Get worker port
                ports = status.get("ports", {})
                port = 8000  # Default
                if "8000/tcp" in ports:
                    port = ports["8000/tcp"][0].get("HostPort", 8000)
                
                worker_url = f"http://{status['ip']}:{port}"
                
                # Check health
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        response = await client.get(f"{worker_url}/health")
                        if response.status_code == 200:
                            data = response.json()
                            if data.get("status") == "healthy":
                                print(f"✅ Worker ready at {worker_url}")
                                self.worker_url = worker_url
                                return True
                except Exception:
                    pass
            
            await asyncio.sleep(10)
        
        print("❌ Timeout waiting for worker")
        return False
    
    async def get_pending_jobs(self) -> list:
        """Get pending jobs from MongoDB via Vercel API"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{WEBHOOK_BASE_URL}/api/jobs/pending",
                    headers={"X-API-Secret": API_SECRET}
                )
                if response.status_code == 200:
                    return response.json().get("jobs", [])
        except Exception as e:
            print(f"⚠️ Failed to get pending jobs: {e}")
        
        return []
    
    async def process_job(self, job: Dict[str, Any]) -> bool:
        """Send a job to the GPU worker"""
        if not self.worker_url:
            return False
        
        try:
            job_id = job.get("_id") or job.get("id")
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.worker_url}/generate/async",
                    json={
                        "job_id": str(job_id),
                        "image_base64": job.get("input", {}).get("imageData", ""),
                        "prompt": job.get("input", {}).get("prompt", ""),
                        "seed": job.get("input", {}).get("settings", {}).get("seed"),
                        "guidance": job.get("input", {}).get("settings", {}).get("guidance", 3.0),
                        "denoise": job.get("input", {}).get("settings", {}).get("denoise", 0.98),
                        "steps": job.get("input", {}).get("settings", {}).get("steps", 25),
                        "webhook_url": f"{WEBHOOK_BASE_URL}/api/webhook/comfyui",
                    },
                    headers={"X-API-Secret": API_SECRET}
                )
                
                if response.status_code == 200:
                    self.last_job_time = datetime.now()
                    print(f"✅ Job {job_id} sent to worker")
                    return True
                else:
                    print(f"❌ Failed to send job: {response.status_code}")
                    
        except Exception as e:
            print(f"❌ Error processing job: {e}")
        
        return False
    
    async def should_stop_gpu(self) -> bool:
        """Check if GPU should be stopped due to idle timeout"""
        if not self.last_job_time:
            return False
        
        idle_time = datetime.now() - self.last_job_time
        return idle_time > timedelta(minutes=IDLE_TIMEOUT_MINUTES)
    
    async def run(self):
        """Main loop for GPU management"""
        print("🔄 GPU Manager starting...")
        print(f"   Instance ID: {self.instance_id}")
        print(f"   Idle timeout: {IDLE_TIMEOUT_MINUTES} minutes")
        print(f"   Poll interval: {POLL_INTERVAL_SECONDS} seconds")
        
        self._running = True
        
        while self._running:
            try:
                # Get current instance status
                status = await self.get_instance_status()
                instance_running = status.get("status") == "running"
                
                # Get pending jobs
                pending_jobs = await self.get_pending_jobs()
                has_pending = len(pending_jobs) > 0
                
                print(f"\n📊 Status: GPU={'🟢' if instance_running else '🔴'} | "
                      f"Pending jobs: {len(pending_jobs)} | "
                      f"Last job: {self.last_job_time or 'Never'}")
                
                # Decision logic
                if has_pending and not instance_running:
                    # Start GPU for pending jobs
                    if await self.start_instance():
                        if await self.wait_for_worker():
                            # Process all pending jobs
                            for job in pending_jobs:
                                await self.process_job(job)
                                await asyncio.sleep(2)  # Small delay between jobs
                
                elif has_pending and instance_running:
                    # Ensure worker is available
                    if not self.worker_url:
                        await self.wait_for_worker()
                    
                    if self.worker_url:
                        # Process pending jobs
                        for job in pending_jobs:
                            await self.process_job(job)
                            await asyncio.sleep(2)
                
                elif not has_pending and instance_running:
                    # Check for idle timeout
                    if await self.should_stop_gpu():
                        print(f"💤 GPU idle for {IDLE_TIMEOUT_MINUTES} minutes, stopping...")
                        await self.stop_instance()
                    else:
                        if self.last_job_time:
                            idle_mins = (datetime.now() - self.last_job_time).seconds // 60
                            remaining = IDLE_TIMEOUT_MINUTES - idle_mins
                            print(f"⏰ GPU will stop in {remaining} minutes if no new jobs")
                
                # Wait before next poll
                await asyncio.sleep(POLL_INTERVAL_SECONDS)
                
            except Exception as e:
                print(f"❌ Error in manager loop: {e}")
                await asyncio.sleep(POLL_INTERVAL_SECONDS)
    
    def stop(self):
        """Stop the manager"""
        self._running = False


async def main():
    """Entry point for GPU manager"""
    manager = GPUManager()
    
    try:
        await manager.run()
    except KeyboardInterrupt:
        print("\n👋 Shutting down GPU manager...")
        manager.stop()


if __name__ == "__main__":
    asyncio.run(main())
