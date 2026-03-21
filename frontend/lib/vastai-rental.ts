/**
 * Vast.ai Rental Actions
 * Handles renting GPUs and setting up ComfyUI workers via Vast.ai API
 */

const VASTAI_API_URL = "https://console.vast.ai/api/v0";

interface RentResult {
  success: boolean;
  instanceId?: number;
  error?: string;
}

/**
 * Rent a GPU instance from Vast.ai using the user's API key
 */
export async function rentGpuInstance(
  vastApiKey: string,
  offerId: number,
  onStartScript: string
): Promise<RentResult> {
  try {
    // Create instance from offer
    const response = await fetch(`${VASTAI_API_URL}/asks/${offerId}/`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${vastApiKey}`,
      },
      body: JSON.stringify({
        client_id: "me",
        image: "pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime",
        disk: 60, // GB
        onstart: onStartScript,
        env: {
          API_SECRET: process.env.API_SECRET || "your-secret-key",
        },
        // Open ports for ComfyUI and worker
        extra: "--expose 8000 --expose 8188",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Vast.ai rent failed:", response.status, errText);
      return {
        success: false,
        error: `Vast.ai API error (${response.status}): ${errText}`,
      };
    }

    const data = await response.json();
    const instanceId = data.new_contract;

    if (!instanceId) {
      return {
        success: false,
        error: "No instance ID returned from Vast.ai",
      };
    }

    console.log(`✅ Rented GPU instance: ${instanceId}`);
    return { success: true, instanceId };
  } catch (error: any) {
    console.error("Rent GPU error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get instance status from Vast.ai (using user's API key)
 */
export async function getInstanceStatusWithKey(
  vastApiKey: string,
  instanceId: number
): Promise<{
  status: string;
  publicIp: string | null;
  ports: Record<string, any>;
  sshPort: number | null;
} | null> {
  try {
    const response = await fetch(`${VASTAI_API_URL}/instances/${instanceId}/`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${vastApiKey}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const inst = data.instances?.[0] || data;

    // Find SSH port and worker port
    const ports = inst.ports || {};
    let sshPort: number | null = null;
    const sshMapping = ports["22/tcp"];
    if (sshMapping && sshMapping[0]) {
      sshPort = sshMapping[0].HostPort;
    }

    return {
      status: inst.actual_status || inst.status_msg || "unknown",
      publicIp: inst.public_ipaddr || null,
      ports: ports,
      sshPort,
    };
  } catch (error) {
    console.error("Get instance status error:", error);
    return null;
  }
}

/**
 * Generate the on-start script that sets up ComfyUI + worker on the rented GPU
 */
export function generateOnStartScript(webhookBaseUrl: string, apiSecret: string): string {
  return `#!/bin/bash
set -e

echo "🚀 Starting automated GPU setup..."

# Install system deps
apt-get update && apt-get install -y git wget curl

# Install ComfyUI
cd /workspace
if [ ! -d "ComfyUI" ]; then
  echo "📦 Installing ComfyUI..."
  git clone https://github.com/comfyanonymous/ComfyUI.git
  cd ComfyUI
  pip install -r requirements.txt
else
  cd ComfyUI
fi

# Download FLUX Kontext Dev model
echo "📥 Downloading FLUX model..."
cd models/diffusion_models
wget -q -c "https://huggingface.co/Comfy-Org/flux1-kontext-dev_ComfyUI/resolve/main/split_files/diffusion_models/flux1-dev-kontext_fp8_scaled.safetensors" || true

# Download VAE
echo "📥 Downloading VAE..."
cd ../vae
wget -q -c "https://huggingface.co/Comfy-Org/Lumina_Image_2.0_Repackaged/resolve/main/split_files/vae/ae.safetensors" || true

# Download Text Encoders
echo "📥 Downloading text encoders..."
cd ../text_encoders
wget -q -c "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors" || true
wget -q -c "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn_scaled.safetensors" || true

# Start ComfyUI in background
echo "🎨 Starting ComfyUI..."
cd /workspace/ComfyUI
nohup python main.py --listen 0.0.0.0 --port 8188 > /workspace/comfyui.log 2>&1 &

# Wait for ComfyUI to start
echo "⏳ Waiting for ComfyUI to initialize..."
for i in $(seq 1 60); do
  if curl -s http://localhost:8188/system_stats > /dev/null 2>&1; then
    echo "✅ ComfyUI is running!"
    break
  fi
  sleep 5
done

# Setup worker
echo "🔧 Setting up HTTP API worker..."
mkdir -p /workspace/worker
cd /workspace/worker
pip install fastapi uvicorn httpx python-multipart pillow

# Create worker.py
cat > /workspace/worker/worker.py << 'WORKER_SCRIPT'
import os, json, base64, uuid, time, asyncio
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx

COMFYUI_URL = os.getenv("COMFYUI_URL", "http://localhost:8188")
API_SECRET = os.getenv("API_SECRET", "${apiSecret}")

app = FastAPI(title="ComfyUI Worker")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class GenerateRequest(BaseModel):
    job_id: str
    image_base64: str
    prompt: str
    seed: Optional[int] = None
    guidance: float = 3.0
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

@app.post("/generate/async")
async def generate_async(request: GenerateRequest, background_tasks: BackgroundTasks):
    if not request.webhook_url:
        raise HTTPException(400, "webhook_url required for async")
    background_tasks.add_task(process_and_callback, request)
    return {"success": True, "job_id": request.job_id, "message": "Processing..."}

async def process_and_callback(request: GenerateRequest):
    result = await run_workflow(request)
    if request.webhook_url:
        async with httpx.AsyncClient(timeout=30.0) as client:
            await client.post(request.webhook_url, json=result, headers={"X-API-Secret": API_SECRET})

async def run_workflow(request: GenerateRequest) -> dict:
    start = time.time()
    try:
        input_filename = f"input_{uuid.uuid4().hex[:8]}.png"
        image_data = base64.b64decode(request.image_base64)
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{COMFYUI_URL}/upload/image", files={"image": (input_filename, image_data, "image/png")}, data={"overwrite": "true"})
            uploaded_name = resp.json().get("name", input_filename)
        workflow = load_workflow()
        workflow = update_workflow(workflow, uploaded_name, request.prompt, request.seed)
        client_id = str(uuid.uuid4())
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow, "client_id": client_id})
            prompt_id = resp.json().get("prompt_id")
        output_image = await wait_for_result(prompt_id, timeout=120)
        if output_image:
            return {"success": True, "job_id": request.job_id, "image_base64": base64.b64encode(output_image).decode(), "execution_time": time.time() - start}
        else:
            return {"success": False, "job_id": request.job_id, "error": "Timeout"}
    except Exception as e:
        return {"success": False, "job_id": request.job_id, "error": str(e)}

def load_workflow():
    wp = os.getenv("WORKFLOW_PATH", "/workspace/workflow.json")
    if os.path.exists(wp):
        with open(wp) as f:
            return json.load(f)
    return {"1": {"class_type": "LoadImage", "inputs": {"image": "input.png"}}}

def update_workflow(workflow, image_name, prompt, seed):
    for nid, node in workflow.items():
        ct = node.get("class_type", "")
        if ct == "LoadImage":
            node["inputs"]["image"] = image_name
        elif ct == "CLIPTextEncode":
            node["inputs"]["text"] = prompt
        elif ct == "KSampler" and seed is not None:
            node["inputs"]["seed"] = seed
    return workflow

async def wait_for_result(prompt_id, timeout=120):
    start = time.time()
    while time.time() - start < timeout:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{COMFYUI_URL}/history/{prompt_id}")
            history = resp.json()
            if prompt_id in history:
                outputs = history[prompt_id].get("outputs", {})
                for nid, output in outputs.items():
                    if "images" in output:
                        img = output["images"][0]
                        resp = await client.get(f"{COMFYUI_URL}/view", params={"filename": img["filename"], "subfolder": img.get("subfolder", ""), "type": "output"})
                        return resp.content
        await asyncio.sleep(2)
    return None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
WORKER_SCRIPT

# Start worker
echo "🚀 Starting worker API on port 8000..."
export API_SECRET="${apiSecret}"
cd /workspace/worker
nohup python -m uvicorn worker:app --host 0.0.0.0 --port 8000 > /workspace/worker.log 2>&1 &

echo "✅ GPU setup complete! Worker running on port 8000"
`;
}
