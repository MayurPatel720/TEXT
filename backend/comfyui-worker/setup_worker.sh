#!/bin/bash
# Quick Setup Script for Existing Vast.ai ComfyUI Instance
# Run this on your Vast.ai instance via SSH/terminal

echo "🚀 Setting up HTTP API Worker for your ComfyUI instance..."

# Create worker directory
mkdir -p /workspace/worker
cd /workspace/worker

# Install Python dependencies
pip install fastapi uvicorn httpx python-multipart pillow

# Create the worker.py file
cat > /workspace/worker/worker.py << 'WORKER_EOF'
"""
HTTP API Worker for ComfyUI - Receives jobs from your Vercel app
"""
import os
import json
import base64
import uuid
import time
import asyncio
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx

# Configuration
COMFYUI_URL = os.getenv("COMFYUI_URL", "http://localhost:8188")
API_SECRET = os.getenv("API_SECRET", "your-secret-key")

app = FastAPI(title="ComfyUI Worker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    job_id: str
    image_base64: str
    prompt: str
    seed: Optional[int] = None
    guidance: float = 3.0
    denoise: float = 0.98
    steps: int = 25
    webhook_url: Optional[str] = None

@app.get("/health")
async def health():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{COMFYUI_URL}/system_stats")
            if resp.status_code == 200:
                return {"status": "healthy", "comfyui": "connected"}
    except:
        pass
    return {"status": "healthy", "comfyui": "checking"}

@app.post("/generate")
async def generate_sync(request: GenerateRequest):
    """Synchronous generation - waits for result"""
    result = await run_workflow(request)
    return result

@app.post("/generate/async")
async def generate_async(request: GenerateRequest, background_tasks: BackgroundTasks):
    """Async generation - returns immediately, calls webhook when done"""
    if not request.webhook_url:
        raise HTTPException(400, "webhook_url required for async")
    background_tasks.add_task(process_and_callback, request)
    return {"success": True, "job_id": request.job_id, "message": "Processing..."}

async def process_and_callback(request: GenerateRequest):
    result = await run_workflow(request)
    if request.webhook_url:
        async with httpx.AsyncClient(timeout=30.0) as client:
            await client.post(
                request.webhook_url,
                json=result,
                headers={"X-API-Secret": API_SECRET}
            )

async def run_workflow(request: GenerateRequest) -> dict:
    """Run the ComfyUI workflow"""
    start = time.time()
    
    try:
        # 1. Save input image
        input_filename = f"input_{uuid.uuid4().hex[:8]}.png"
        image_data = base64.b64decode(request.image_base64)
        
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{COMFYUI_URL}/upload/image",
                files={"image": (input_filename, image_data, "image/png")},
                data={"overwrite": "true"}
            )
            uploaded_name = resp.json().get("name", input_filename)
        
        # 2. Load and prepare workflow
        workflow = load_workflow()
        workflow = update_workflow(workflow, uploaded_name, request.prompt, request.seed)
        
        # 3. Queue prompt
        client_id = str(uuid.uuid4())
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{COMFYUI_URL}/prompt",
                json={"prompt": workflow, "client_id": client_id}
            )
            prompt_id = resp.json().get("prompt_id")
        
        # 4. Wait for completion
        output_image = await wait_for_result(prompt_id, timeout=120)
        
        if output_image:
            return {
                "success": True,
                "job_id": request.job_id,
                "image_base64": base64.b64encode(output_image).decode(),
                "execution_time": time.time() - start
            }
        else:
            return {
                "success": False,
                "job_id": request.job_id,
                "error": "Timeout waiting for result"
            }
    except Exception as e:
        return {
            "success": False,
            "job_id": request.job_id,
            "error": str(e)
        }

def load_workflow():
    """Load the workflow from file - UPDATE THIS PATH TO YOUR WORKFLOW"""
    workflow_path = os.getenv("WORKFLOW_PATH", "/workspace/workflow.json")
    with open(workflow_path) as f:
        data = json.load(f)
    
    # Convert ComfyUI export format to API format if needed
    if "nodes" in data:
        # It's in web format, convert to API format
        return convert_to_api_format(data)
    return data

def convert_to_api_format(web_workflow: dict) -> dict:
    """Convert ComfyUI web export to API format"""
    api_workflow = {}
    
    for node in web_workflow.get("nodes", []):
        node_id = str(node["id"])
        class_type = node.get("type")
        
        api_workflow[node_id] = {
            "class_type": class_type,
            "inputs": {}
        }
        
        # Map widget values to inputs based on node type
        widgets = node.get("widgets_values", [])
        
        if class_type == "LoadImage" and widgets:
            api_workflow[node_id]["inputs"]["image"] = widgets[0]
        elif class_type == "CLIPTextEncode" and widgets:
            api_workflow[node_id]["inputs"]["text"] = widgets[0]
        elif class_type == "KSampler" and len(widgets) >= 7:
            api_workflow[node_id]["inputs"]["seed"] = widgets[0]
            api_workflow[node_id]["inputs"]["steps"] = widgets[2]
            api_workflow[node_id]["inputs"]["cfg"] = widgets[3]
            api_workflow[node_id]["inputs"]["sampler_name"] = widgets[4]
            api_workflow[node_id]["inputs"]["scheduler"] = widgets[5]
            api_workflow[node_id]["inputs"]["denoise"] = widgets[6]
        elif class_type == "FluxGuidance" and widgets:
            api_workflow[node_id]["inputs"]["guidance"] = widgets[0]
        elif class_type == "SaveImage" and widgets:
            api_workflow[node_id]["inputs"]["filename_prefix"] = widgets[0]
    
    # Map links (connections between nodes)
    links = {l[0]: (l[1], l[2]) for l in web_workflow.get("links", [])}
    
    for node in web_workflow.get("nodes", []):
        node_id = str(node["id"])
        for inp in node.get("inputs", []):
            if inp.get("link"):
                link_id = inp["link"]
                if link_id in links:
                    src_node, src_slot = links[link_id]
                    api_workflow[node_id]["inputs"][inp["name"]] = [str(src_node), src_slot]
    
    return api_workflow

def update_workflow(workflow: dict, image_name: str, prompt: str, seed: Optional[int]) -> dict:
    """Update workflow with input image, prompt, and seed"""
    for node_id, node in workflow.items():
        class_type = node.get("class_type", "")
        
        if class_type == "LoadImage":
            node["inputs"]["image"] = image_name
        elif class_type == "CLIPTextEncode":
            if "Prompt" in node.get("_meta", {}).get("title", "") or not node["inputs"].get("text"):
                node["inputs"]["text"] = prompt
        elif class_type == "KSampler" and seed is not None:
            node["inputs"]["seed"] = seed
    
    return workflow

async def wait_for_result(prompt_id: str, timeout: int = 120) -> Optional[bytes]:
    """Poll for workflow completion and return output image"""
    start = time.time()
    
    while time.time() - start < timeout:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{COMFYUI_URL}/history/{prompt_id}")
            history = resp.json()
            
            if prompt_id in history:
                outputs = history[prompt_id].get("outputs", {})
                for node_id, output in outputs.items():
                    if "images" in output:
                        img = output["images"][0]
                        # Download the image
                        resp = await client.get(
                            f"{COMFYUI_URL}/view",
                            params={
                                "filename": img["filename"],
                                "subfolder": img.get("subfolder", ""),
                                "type": "output"
                            }
                        )
                        return resp.content
        
        await asyncio.sleep(2)
    
    return None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
WORKER_EOF

echo "✅ Worker created at /workspace/worker/worker.py"

# Create start script
cat > /workspace/start_worker.sh << 'START_EOF'
#!/bin/bash
cd /workspace/worker
export COMFYUI_URL="http://localhost:8188"
export API_SECRET="your-secret-key-here"
export WORKFLOW_PATH="/workspace/workflow.json"
python -m uvicorn worker:app --host 0.0.0.0 --port 8000
START_EOF

chmod +x /workspace/start_worker.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Copy your work.json to /workspace/workflow.json"
echo "2. Edit /workspace/start_worker.sh and set API_SECRET"
echo "3. Make sure ComfyUI is running on port 8188" 
echo "4. Run: /workspace/start_worker.sh"
echo "5. Test: curl http://localhost:8000/health"
echo ""
