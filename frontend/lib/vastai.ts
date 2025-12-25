"""
Vast.ai API Client for GPU Instance Management
Handles auto-start/stop of GPU instances based on job queue
"""

import os
import time
import httpx
from typing import Optional, Dict, List
from dataclasses import dataclass
from enum import Enum


class InstanceStatus(Enum):
    RUNNING = "running"
    STOPPED = "stopped"  # Inactive but reserved
    STARTING = "starting"
    STOPPING = "stopping"
    UNKNOWN = "unknown"


@dataclass
class GPUInstance:
    """Represents a Vast.ai GPU instance"""
    id: int
    status: InstanceStatus
    ip_address: Optional[str]
    port: int
    gpu_name: str
    cost_per_hour: float
    disk_cost_per_day: float
    start_time: Optional[float] = None
    
    @property
    def is_available(self) -> bool:
        return self.status == InstanceStatus.RUNNING and self.ip_address is not None


class VastAIClient:
    """Client for interacting with Vast.ai API"""
    
    BASE_URL = "https://console.vast.ai/api/v0"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("VASTAI_API_KEY")
        if not self.api_key:
            raise ValueError("VASTAI_API_KEY environment variable required")
        
        self.instance_id = os.getenv("VASTAI_INSTANCE_ID")
        self._http_client: Optional[httpx.AsyncClient] = None
    
    @property
    def headers(self) -> Dict[str, str]:
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
    
    async def _get_client(self) -> httpx.AsyncClient:
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                headers=self.headers,
                timeout=30.0,
            )
        return self._http_client
    
    async def close(self):
        if self._http_client:
            await self._http_client.aclose()
    
    async def get_instances(self) -> List[Dict]:
        """Get all user instances"""
        client = await self._get_client()
        response = await client.get("/instances/")
        response.raise_for_status()
        return response.json().get("instances", [])
    
    async def get_instance(self, instance_id: Optional[int] = None) -> Optional[GPUInstance]:
        """Get specific instance by ID"""
        instance_id = instance_id or self.instance_id
        if not instance_id:
            return None
        
        instances = await self.get_instances()
        for inst in instances:
            if str(inst.get("id")) == str(instance_id):
                status = InstanceStatus.UNKNOWN
                actual_status = inst.get("actual_status", "").lower()
                
                if actual_status == "running":
                    status = InstanceStatus.RUNNING
                elif actual_status in ("stopped", "inactive"):
                    status = InstanceStatus.STOPPED
                elif actual_status == "loading":
                    status = InstanceStatus.STARTING
                
                return GPUInstance(
                    id=inst["id"],
                    status=status,
                    ip_address=inst.get("public_ipaddr"),
                    port=inst.get("ports", {}).get("8000/tcp", [{}])[0].get("HostPort", 8000),
                    gpu_name=inst.get("gpu_name", "Unknown"),
                    cost_per_hour=float(inst.get("dph_total", 0)),
                    disk_cost_per_day=float(inst.get("storage_cost", 0)),
                    start_time=inst.get("start_date"),
                )
        
        return None
    
    async def start_instance(self, instance_id: Optional[int] = None) -> bool:
        """Start a stopped instance"""
        instance_id = instance_id or self.instance_id
        if not instance_id:
            raise ValueError("Instance ID required")
        
        client = await self._get_client()
        
        # Use the instances endpoint with PUT to start
        response = await client.put(
            f"/instances/{instance_id}/",
            json={"state": "running"}
        )
        
        if response.status_code in (200, 202):
            print(f"✅ Instance {instance_id} start requested")
            return True
        
        print(f"❌ Failed to start instance: {response.status_code} - {response.text}")
        return False
    
    async def stop_instance(self, instance_id: Optional[int] = None) -> bool:
        """Stop a running instance (keeps storage, cheaper)"""
        instance_id = instance_id or self.instance_id
        if not instance_id:
            raise ValueError("Instance ID required")
        
        client = await self._get_client()
        
        response = await client.put(
            f"/instances/{instance_id}/",
            json={"state": "stopped"}
        )
        
        if response.status_code in (200, 202):
            print(f"✅ Instance {instance_id} stop requested")
            return True
        
        print(f"❌ Failed to stop instance: {response.status_code} - {response.text}")
        return False
    
    async def wait_for_status(
        self, 
        target_status: InstanceStatus,
        instance_id: Optional[int] = None,
        timeout: int = 300,
        poll_interval: int = 10
    ) -> bool:
        """Wait for instance to reach target status"""
        instance_id = instance_id or self.instance_id
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            instance = await self.get_instance(instance_id)
            if instance and instance.status == target_status:
                return True
            
            await asyncio.sleep(poll_interval)
        
        return False
    
    async def get_worker_url(self, instance_id: Optional[int] = None) -> Optional[str]:
        """Get the worker URL for an instance"""
        instance = await self.get_instance(instance_id)
        if instance and instance.is_available and instance.ip_address:
            return f"http://{instance.ip_address}:{instance.port}"
        return None
    
    async def health_check(self, worker_url: str) -> bool:
        """Check if worker is healthy and ready"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{worker_url}/health")
                data = response.json()
                return data.get("status") == "healthy"
        except Exception:
            return False


# Import asyncio for wait_for_status
import asyncio


async def ensure_gpu_available() -> Optional[str]:
    """
    Ensure GPU is running and return worker URL.
    Starts the instance if stopped.
    
    Returns:
        Worker URL if available, None otherwise
    """
    client = VastAIClient()
    
    try:
        instance = await client.get_instance()
        
        if not instance:
            print("❌ No instance configured")
            return None
        
        print(f"📊 Instance {instance.id}: {instance.status.value} ({instance.gpu_name})")
        
        # If already running, check health
        if instance.status == InstanceStatus.RUNNING:
            worker_url = await client.get_worker_url()
            if worker_url:
                # Verify it's actually healthy
                if await client.health_check(worker_url):
                    print(f"✅ GPU ready at {worker_url}")
                    return worker_url
                else:
                    print("⚠️ Instance running but worker not healthy, waiting...")
                    await asyncio.sleep(30)
                    if await client.health_check(worker_url):
                        return worker_url
        
        # If stopped, start it
        if instance.status == InstanceStatus.STOPPED:
            print(f"🚀 Starting GPU instance {instance.id}...")
            success = await client.start_instance()
            if not success:
                return None
            
            # Wait for it to be running
            print("⏳ Waiting for instance to start (up to 5 min)...")
            if not await client.wait_for_status(InstanceStatus.RUNNING, timeout=300):
                print("❌ Timeout waiting for instance to start")
                return None
            
            # Wait for worker to be healthy
            print("⏳ Waiting for worker to initialize...")
            worker_url = await client.get_worker_url()
            
            for _ in range(12):  # Wait up to 2 min for worker
                await asyncio.sleep(10)
                if worker_url and await client.health_check(worker_url):
                    print(f"✅ GPU ready at {worker_url}")
                    return worker_url
                worker_url = await client.get_worker_url()
            
            print("❌ Worker failed to initialize")
            return None
        
        # If starting, wait for it
        if instance.status == InstanceStatus.STARTING:
            print("⏳ Instance already starting, waiting...")
            if await client.wait_for_status(InstanceStatus.RUNNING, timeout=300):
                worker_url = await client.get_worker_url()
                if worker_url and await client.health_check(worker_url):
                    return worker_url
        
        return None
        
    finally:
        await client.close()


async def stop_gpu_if_idle(idle_timeout_minutes: int = 10) -> bool:
    """
    Stop GPU instance if no jobs processed recently.
    
    Args:
        idle_timeout_minutes: Minutes of idle time before stopping
        
    Returns:
        True if stopped, False otherwise
    """
    client = VastAIClient()
    
    try:
        instance = await client.get_instance()
        
        if not instance or instance.status != InstanceStatus.RUNNING:
            return False
        
        # Check worker's last activity
        worker_url = await client.get_worker_url()
        if not worker_url:
            return False
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                response = await http_client.get(f"{worker_url}/health")
                data = response.json()
                
                # If worker has no recent activity, stop it
                # (This would require adding activity tracking to the worker)
                # For now, we'll use a simple approach via the API
                
        except Exception:
            pass
        
        print(f"⏹️ Stopping idle GPU instance {instance.id}...")
        return await client.stop_instance()
        
    finally:
        await client.close()
