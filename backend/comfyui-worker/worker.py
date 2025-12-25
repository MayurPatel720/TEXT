"""
FLUX Kontext Worker for Vast.ai
Complete worker with multi-image support, negative prompts, and upscaling.

Run on Vast.ai:
1. cd /workspace/worker
2. pip install fastapi uvicorn httpx python-multipart
3. python worker.py
4. In another terminal: npx localtunnel --port 8000 --subdomain textile-gpu-worker
"""

from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import httpx, base64, uuid, asyncio, json
import uvicorn

app = FastAPI()
COMFYUI = 'http://localhost:18188'
API_SECRET = 'my-secret-key-123'

# Aspect ratio to dimensions
ASPECT_SIZES = {
    "1:1": (1024, 1024),
    "16:9": (1280, 720),
    "4:3": (1024, 768),
    "3:2": (1024, 683)
}

class GenerateReq(BaseModel):
    job_id: str
    image_base64: str
    image2_base64: Optional[str] = None  # Second reference image
    prompt: str
    negative_prompt: Optional[str] = ""
    seed: Optional[int] = None
    style_strength: Optional[float] = 0.9
    structure_strength: Optional[float] = 0.5
    guidance: Optional[float] = 3.0
    quality: Optional[int] = 90
    aspect_ratio: Optional[str] = "1:1"
    output_format: Optional[str] = "png"
    steps: Optional[int] = 25
    webhook_url: Optional[str] = None

class UpscaleReq(BaseModel):
    job_id: str
    image_filename: str
    webhook_url: Optional[str] = None

@app.get('/health')
async def health():
    return {'status': 'healthy'}

@app.post('/generate/async')
async def generate(r: GenerateReq, bg: BackgroundTasks):
    print(f"📥 Job {r.job_id}: prompt={r.prompt[:50]}...")
    print(f"   style={r.style_strength}, structure={r.structure_strength}, guidance={r.guidance}")
    print(f"   has_image2={bool(r.image2_base64)}, negative={r.negative_prompt[:30] if r.negative_prompt else 'none'}")
    bg.add_task(process_generate, r)
    return {'success': True, 'job_id': r.job_id}

@app.post('/upscale/async')
async def upscale(r: UpscaleReq, bg: BackgroundTasks):
    print(f"🔍 Upscale job {r.job_id}: {r.image_filename}")
    bg.add_task(process_upscale, r)
    return {'success': True, 'job_id': r.job_id}

async def upload_image(img_b64: str, filename: str) -> str:
    """Upload image to ComfyUI and return filename"""
    img = base64.b64decode(img_b64)
    async with httpx.AsyncClient(timeout=30.0) as c:
        resp = await c.post(f'{COMFYUI}/upload/image',
            files={'image': (filename, img, 'image/png')},
            data={'overwrite': 'true'})
        result = resp.json()
        return result.get('name', filename)

async def process_generate(r: GenerateReq):
    try:
        print(f"🎨 Processing {r.job_id}...")
        
        # Upload primary image
        filename1 = f'input_{r.job_id[:8]}_1.png'
        uploaded1 = await upload_image(r.image_base64, filename1)
        print(f"📤 Uploaded primary: {uploaded1}")
        
        # Upload secondary image if provided
        filename2 = None
        if r.image2_base64:
            filename2 = f'input_{r.job_id[:8]}_2.png'
            uploaded2 = await upload_image(r.image2_base64, filename2)
            print(f"📤 Uploaded secondary: {uploaded2}")
        
        # Calculate denoise from structure_strength (higher structure = lower denoise)
        denoise = 1 - (r.structure_strength * 0.7)  # 0.5 structure → 0.65 denoise
        
        # Build workflow
        workflow = build_workflow(
            image1=uploaded1,
            image2=filename2,
            prompt=r.prompt,
            negative_prompt=r.negative_prompt or "",
            seed=r.seed or 42,
            steps=r.steps or 25,
            guidance=r.guidance or 3.0,
            denoise=denoise,
            job_id=r.job_id
        )
        
        # Queue workflow
        async with httpx.AsyncClient(timeout=300.0) as c:
            resp = await c.post(f'{COMFYUI}/prompt', json={"prompt": workflow})
            result = resp.json()
            prompt_id = result.get('prompt_id')
            if not prompt_id:
                print(f"⚠️ Queue error: {result}")
                raise Exception(f"Queue failed: {result}")
            print(f"🚀 Queued: {prompt_id}")
        
        # Wait for completion
        output_filename = await wait_for_completion(prompt_id)
        
        if output_filename:
            print(f"✅ Generated: {output_filename}")
            await send_callback(r.webhook_url, r.job_id, output_filename, success=True)
        else:
            raise Exception("Timeout waiting for generation")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        if r.webhook_url:
            await send_callback(r.webhook_url, r.job_id, None, success=False, error=str(e))

async def process_upscale(r: UpscaleReq):
    try:
        print(f"🔍 Upscaling {r.image_filename}...")
        
        # Build upscale workflow
        workflow = {
            "1": {"class_type": "LoadImage", "inputs": {"image": r.image_filename}},
            "2": {"class_type": "UpscaleModelLoader", "inputs": {"model_name": "4x_foolhardy_Remacri.pth"}},
            "3": {"class_type": "ImageUpscaleWithModel", "inputs": {
                "upscale_model": ["2", 0], "image": ["1", 0]
            }},
            "4": {"class_type": "ImageScaleBy", "inputs": {
                "image": ["3", 0], "upscale_method": "lanczos", "scale_by": 0.5
            }},
            "5": {"class_type": "SaveImage", "inputs": {
                "images": ["4", 0], "filename_prefix": f"UP_{r.job_id}"
            }}
        }
        
        async with httpx.AsyncClient(timeout=300.0) as c:
            resp = await c.post(f'{COMFYUI}/prompt', json={"prompt": workflow})
            result = resp.json()
            prompt_id = result.get('prompt_id')
            print(f"🚀 Upscale queued: {prompt_id}")
        
        output_filename = await wait_for_completion(prompt_id, timeout=60)
        
        if output_filename:
            print(f"✅ Upscaled: {output_filename}")
            await send_callback(r.webhook_url, r.job_id, output_filename, success=True, is_upscale=True)
        else:
            raise Exception("Upscale timeout")
            
    except Exception as e:
        print(f"❌ Upscale error: {e}")
        if r.webhook_url:
            await send_callback(r.webhook_url, r.job_id, None, success=False, error=str(e))

def build_workflow(image1, image2, prompt, negative_prompt, seed, steps, guidance, denoise, job_id):
    """Build ComfyUI workflow matching your design"""
    
    workflow = {
        # Step 1: Load Models
        "37": {"class_type": "UNETLoader", "inputs": {
            "unet_name": "flux1-dev-kontext_fp8_scaled.safetensors", 
            "weight_dtype": "default"
        }},
        "38": {"class_type": "DualCLIPLoader", "inputs": {
            "clip_name1": "clip_l.safetensors", 
            "clip_name2": "t5xxl_fp8_e4m3fn_scaled.safetensors", 
            "type": "flux"
        }},
        "39": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
        
        # Step 2: Load primary image
        "142": {"class_type": "LoadImage", "inputs": {"image": image1}},
    }
    
    # If two images, stitch them together
    if image2:
        workflow["147"] = {"class_type": "LoadImage", "inputs": {"image": image2}}
        workflow["146"] = {"class_type": "ImageStitch", "inputs": {
            "image1": ["142", 0], 
            "image2": ["147", 0],
            "direction": "right",
            "match_image_size": True,
            "feathering": 0,
            "spacing_width": 0,
            "spacing_color": "white"
        }}
        image_source = ["146", 0]
    else:
        image_source = ["142", 0]
    
    # Continue workflow
    workflow.update({
        # Scale image properly for Kontext
        "42": {"class_type": "FluxKontextImageScale", "inputs": {"image": image_source}},
        
        # Encode to latent
        "124": {"class_type": "VAEEncode", "inputs": {
            "pixels": ["42", 0], "vae": ["39", 0]
        }},
        
        # Positive prompt
        "6": {"class_type": "CLIPTextEncode", "inputs": {
            "clip": ["38", 0], "text": prompt
        }},
        
        # Negative prompt (or zero out if empty)
        "6_neg": {"class_type": "CLIPTextEncode", "inputs": {
            "clip": ["38", 0], "text": negative_prompt if negative_prompt else "ugly, blurry, bad quality"
        }},
        "135": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["6_neg", 0]}},
        
        # Reference latent (key for img2img with FLUX Kontext)
        "177": {"class_type": "ReferenceLatent", "inputs": {
            "conditioning": ["6", 0], "latent": ["124", 0]
        }},
        
        # Flux guidance
        "35": {"class_type": "FluxGuidance", "inputs": {
            "conditioning": ["177", 0], "guidance": guidance
        }},
        
        # KSampler
        "31": {"class_type": "KSampler", "inputs": {
            "model": ["37", 0],
            "positive": ["35", 0],
            "negative": ["135", 0],
            "latent_image": ["124", 0],
            "seed": seed,
            "steps": steps,
            "cfg": 1,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": denoise
        }},
        
        # Decode and save
        "8": {"class_type": "VAEDecode", "inputs": {
            "samples": ["31", 0], "vae": ["39", 0]
        }},
        "136": {"class_type": "SaveImage", "inputs": {
            "images": ["8", 0], "filename_prefix": f"out_{job_id}"
        }}
    })
    
    return workflow

async def wait_for_completion(prompt_id, timeout=120):
    """Wait for ComfyUI to complete and return output filename"""
    for i in range(timeout):
        await asyncio.sleep(2)
        async with httpx.AsyncClient() as c:
            resp = await c.get(f'{COMFYUI}/history/{prompt_id}')
            history = resp.json()
            if prompt_id in history:
                for node_output in history[prompt_id].get('outputs', {}).values():
                    if 'images' in node_output:
                        return node_output['images'][0]['filename']
        if i % 15 == 0: 
            print(f"⏳ Waiting... {i*2}s")
    return None

async def send_callback(webhook_url, job_id, filename, success, error=None, is_upscale=False):
    """Send result back to Vercel webhook"""
    if not webhook_url:
        return
        
    payload = {'success': success, 'job_id': job_id, 'is_upscale': is_upscale}
    
    if success and filename:
        # Fetch image data
        async with httpx.AsyncClient() as c:
            img_resp = await c.get(f'{COMFYUI}/view?filename={filename}')
            payload['image_base64'] = base64.b64encode(img_resp.content).decode()
            payload['execution_time'] = 40
    else:
        payload['error'] = error or 'Unknown error'
    
    async with httpx.AsyncClient(timeout=30.0) as c:
        await c.post(webhook_url, 
            headers={'X-API-Secret': API_SECRET},
            json=payload)
        print(f"📧 Callback sent! (upscale={is_upscale})")

if __name__ == '__main__':
    print("🚀 Starting FLUX Kontext Worker on port 8000...")
    print("📡 Make sure localtunnel is running: npx localtunnel --port 8000 --subdomain textile-gpu-worker")
    uvicorn.run(app, host='0.0.0.0', port=8000)
