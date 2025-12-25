"""
HTTP API Worker for Textile Design Generation
Exposes endpoints for job submission that Vercel can call
"""

import os
import base64
import uuid
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

from comfyui_api import execute_workflow, get_system_stats


# Configuration from environment
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "")  # Your Vercel webhook endpoint
MONGODB_URI = os.getenv("MONGODB_URI", "")
API_SECRET = os.getenv("API_SECRET", "your-secret-key")  # For authentication


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("🚀 Worker starting up...")
    yield
    print("👋 Worker shutting down...")


app = FastAPI(
    title="Textile Design ComfyUI Worker",
    description="HTTP API for FLUX Kontext Dev textile design generation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    """Request body for generation"""
    job_id: str
    image_base64: str  # Base64 encoded input image
    prompt: str
    seed: Optional[int] = None
    guidance: float = 3.0
    denoise: float = 0.98
    steps: int = 25
    webhook_url: Optional[str] = None  # Override default webhook


class GenerateResponse(BaseModel):
    """Response for generation request"""
    success: bool
    job_id: str
    message: str
    image_base64: Optional[str] = None
    execution_time: Optional[float] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    comfyui: str
    gpu_info: Optional[dict] = None
    timestamp: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if the worker and ComfyUI are healthy"""
    try:
        stats = await get_system_stats()
        gpu_info = stats.get("devices", [{}])[0] if stats.get("devices") else None
        
        return HealthResponse(
            status="healthy",
            comfyui="connected",
            gpu_info=gpu_info,
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            comfyui=f"error: {str(e)}",
            timestamp=datetime.utcnow().isoformat()
        )


@app.post("/generate", response_model=GenerateResponse)
async def generate_design(request: GenerateRequest, background_tasks: BackgroundTasks):
    """
    Generate a textile design from an input image
    
    This endpoint processes the request synchronously and returns the result.
    For async processing, use /generate/async
    """
    try:
        # Decode input image
        try:
            image_data = base64.b64decode(request.image_base64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
        
        # Execute workflow
        result = await execute_workflow(
            input_image_data=image_data,
            prompt=request.prompt,
            seed=request.seed,
            guidance=request.guidance,
            denoise=request.denoise,
            steps=request.steps
        )
        
        if result["success"]:
            # Encode output image to base64
            output_base64 = base64.b64encode(result["image_data"]).decode("utf-8")
            
            return GenerateResponse(
                success=True,
                job_id=request.job_id,
                message="Generation completed successfully",
                image_base64=output_base64,
                execution_time=result["execution_time"]
            )
        else:
            return GenerateResponse(
                success=False,
                job_id=request.job_id,
                message="Generation failed",
                error=result.get("error", "Unknown error"),
                execution_time=result.get("execution_time")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        return GenerateResponse(
            success=False,
            job_id=request.job_id,
            message="Internal server error",
            error=str(e)
        )


async def process_and_callback(request: GenerateRequest, webhook_url: str):
    """Background task to process generation and call webhook"""
    try:
        # Decode input image
        image_data = base64.b64decode(request.image_base64)
        
        # Execute workflow
        result = await execute_workflow(
            input_image_data=image_data,
            prompt=request.prompt,
            seed=request.seed,
            guidance=request.guidance,
            denoise=request.denoise,
            steps=request.steps
        )
        
        # Prepare webhook payload
        if result["success"]:
            payload = {
                "success": True,
                "job_id": request.job_id,
                "image_base64": base64.b64encode(result["image_data"]).decode("utf-8"),
                "execution_time": result["execution_time"]
            }
        else:
            payload = {
                "success": False,
                "job_id": request.job_id,
                "error": result.get("error", "Unknown error"),
                "execution_time": result.get("execution_time")
            }
        
        # Call webhook
        async with httpx.AsyncClient() as client:
            await client.post(
                webhook_url,
                json=payload,
                headers={"X-API-Secret": API_SECRET},
                timeout=30.0
            )
            
    except Exception as e:
        # Try to notify webhook of failure
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    webhook_url,
                    json={
                        "success": False,
                        "job_id": request.job_id,
                        "error": str(e)
                    },
                    headers={"X-API-Secret": API_SECRET},
                    timeout=10.0
                )
        except:
            pass  # Webhook notification failed


@app.post("/generate/async")
async def generate_design_async(request: GenerateRequest, background_tasks: BackgroundTasks):
    """
    Queue a generation job for async processing
    
    The result will be sent to the webhook URL when complete.
    """
    webhook_url = request.webhook_url or WEBHOOK_URL
    
    if not webhook_url:
        raise HTTPException(
            status_code=400,
            detail="No webhook URL configured. Provide webhook_url in request or set WEBHOOK_URL env var."
        )
    
    # Queue the background task
    background_tasks.add_task(process_and_callback, request, webhook_url)
    
    return {
        "success": True,
        "job_id": request.job_id,
        "message": "Job queued for processing",
        "webhook_url": webhook_url
    }


@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "name": "Textile Design ComfyUI Worker",
        "version": "1.0.0",
        "endpoints": {
            "/health": "Health check",
            "/generate": "Synchronous generation",
            "/generate/async": "Async generation with webhook callback"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
