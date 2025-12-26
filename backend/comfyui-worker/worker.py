"""
FLUX Kontext Worker for Vast.ai
Production worker with 7 specialized workflows and proper field mapping.

UI Fields → Workflow Mapping:
- prompt → CLIPTextEncode text
- negative_prompt → ConditioningZeroOut 
- guidance → FluxGuidance value (1-10, default 2.5)
- steps → KSampler steps (15-50, default 25)
- seed → KSampler seed
- style_strength → NOT USED (reserved for future)
- structure_strength → Maps to denoise (higher structure = lower denoise)
- aspect_ratio → EmptySD3LatentImage dimensions
- workflow_type → Selects workflow builder

Run on Vast.ai:
1. cd /workspace/worker
2. pip install fastapi uvicorn httpx python-multipart
3. python worker.py
4. In another terminal: npx localtunnel --port 8000 --subdomain textile-gpu-worker
"""

from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Literal
import httpx, base64, asyncio, random
import uvicorn

app = FastAPI()
COMFYUI = 'http://localhost:18188'
API_SECRET = 'my-secret-key-123'

# Aspect ratio to dimensions for EmptySD3LatentImage
ASPECT_SIZES = {
    "1:1": (1024, 1024),
    "16:9": (1344, 768),
    "9:16": (768, 1344),
    "4:3": (1152, 896),
    "3:4": (896, 1152),
    "3:2": (1216, 832),
    "2:3": (832, 1216),
}

class GenerateReq(BaseModel):
    job_id: str
    image_base64: str
    image2_base64: Optional[str] = None
    prompt: str
    negative_prompt: Optional[str] = ""
    seed: Optional[int] = None
    style_strength: Optional[float] = 0.9
    structure_strength: Optional[float] = 0.5
    guidance: Optional[float] = 2.5
    quality: Optional[int] = 90
    aspect_ratio: Optional[str] = "1:1"
    output_format: Optional[str] = "png"
    steps: Optional[int] = 25
    workflow_type: Optional[str] = "creative_edit"  # NEW!
    webhook_url: Optional[str] = None

class UpscaleReq(BaseModel):
    job_id: str
    image_filename: str
    webhook_url: Optional[str] = None

@app.get('/health')
async def health():
    return {'status': 'healthy', 'workflows': list(WORKFLOW_BUILDERS.keys())}

@app.post('/generate/async')
async def generate(r: GenerateReq, bg: BackgroundTasks):
    print(f"📥 Job {r.job_id}")
    print(f"   workflow={r.workflow_type}, prompt={r.prompt[:40]}...")
    print(f"   guidance={r.guidance}, steps={r.steps}, structure={r.structure_strength}")
    print(f"   has_image2={bool(r.image2_base64)}, aspect={r.aspect_ratio}")
    bg.add_task(process_generate, r)
    return {'success': True, 'job_id': r.job_id}

@app.post('/upscale/async')
async def upscale(r: UpscaleReq, bg: BackgroundTasks):
    print(f"🔍 Upscale job {r.job_id}: {r.image_filename}")
    bg.add_task(process_upscale, r)
    return {'success': True, 'job_id': r.job_id}

async def upload_image(img_b64: str, filename: str) -> str:
    img = base64.b64decode(img_b64)
    async with httpx.AsyncClient(timeout=30.0) as c:
        resp = await c.post(f'{COMFYUI}/upload/image',
            files={'image': (filename, img, 'image/png')},
            data={'overwrite': 'true'})
        result = resp.json()
        return result.get('name', filename)

async def process_generate(r: GenerateReq):
    try:
        print(f"🎨 Processing {r.job_id} with {r.workflow_type}...")
        
        # Upload images
        filename1 = f'input_{r.job_id[:8]}_1.png'
        uploaded1 = await upload_image(r.image_base64, filename1)
        print(f"📤 Uploaded: {uploaded1}")
        
        uploaded2 = None
        if r.image2_base64:
            filename2 = f'input_{r.job_id[:8]}_2.png'
            uploaded2 = await upload_image(r.image2_base64, filename2)
            print(f"📤 Uploaded secondary: {uploaded2}")
        
        # Get workflow builder
        builder = WORKFLOW_BUILDERS.get(r.workflow_type, build_creative_edit)
        
        # Get output dimensions from aspect ratio
        width, height = ASPECT_SIZES.get(r.aspect_ratio, (1024, 1024))
        
        # Build workflow
        workflow = builder(
            image1=uploaded1,
            image2=uploaded2,
            prompt=r.prompt,
            negative_prompt=r.negative_prompt or "ugly, blurry, bad quality, distorted",
            seed=r.seed or random.randint(1, 999999999),
            steps=r.steps or 25,
            guidance=r.guidance or 2.5,
            structure_strength=r.structure_strength or 0.5,
            width=width,
            height=height,
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
        import traceback
        traceback.print_exc()
        if r.webhook_url:
            await send_callback(r.webhook_url, r.job_id, None, success=False, error=str(e))

async def process_upscale(r: UpscaleReq):
    try:
        print(f"🔍 Upscaling {r.image_filename}...")
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

# =============================================================================
# BASE WORKFLOW COMPONENTS (shared by all workflows)
# =============================================================================

def get_model_loaders():
    """Common model loading nodes"""
    return {
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
    }

def get_text_encoding(prompt, negative_prompt):
    """Text encoding nodes"""
    return {
        "6": {"class_type": "CLIPTextEncode", "inputs": {
            "clip": ["38", 0], "text": prompt
        }},
        "6_neg": {"class_type": "CLIPTextEncode", "inputs": {
            "clip": ["38", 0], "text": negative_prompt
        }},
        "135": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["6_neg", 0]}},
    }

# =============================================================================
# WORKFLOW 1: APPLY PATTERN (2 images → design on fabric)
# =============================================================================

def build_apply_pattern(image1, image2, prompt, negative_prompt, seed, steps, guidance, structure_strength, width, height, job_id):
    """Apply pattern from image2 to fabric in image1"""
    workflow = get_model_loaders()
    workflow.update(get_text_encoding(prompt, negative_prompt))
    
    # Load both images and stitch
    workflow["142"] = {"class_type": "LoadImage", "inputs": {"image": image1}}
    if image2:
        workflow["147"] = {"class_type": "LoadImage", "inputs": {"image": image2}}
        workflow["146"] = {"class_type": "ImageStitch", "inputs": {
            "image1": ["142", 0], "image2": ["147", 0],
            "direction": "right", "match_image_size": True,
            "feathering": 0, "spacing_width": 0, "spacing_color": "white"
        }}
        ref_source = ["146", 0]
    else:
        ref_source = ["142", 0]
    
    workflow.update({
        # Scale and encode reference
        "42": {"class_type": "FluxKontextImageScale", "inputs": {"image": ref_source}},
        "124": {"class_type": "VAEEncode", "inputs": {"pixels": ["42", 0], "vae": ["39", 0]}},
        
        # ReferenceLatent for conditioning
        "177": {"class_type": "ReferenceLatent", "inputs": {
            "conditioning": ["6", 0], "latent": ["124", 0]
        }},
        "35": {"class_type": "FluxGuidance", "inputs": {
            "conditioning": ["177", 0], "guidance": guidance
        }},
        
        # EmptySD3LatentImage for fresh output!
        "188": {"class_type": "EmptySD3LatentImage", "inputs": {
            "width": width, "height": height, "batch_size": 1
        }},
        
        # KSampler with EMPTY latent (denoise=1.0)
        "31": {"class_type": "KSampler", "inputs": {
            "model": ["37", 0],
            "positive": ["35", 0],
            "negative": ["135", 0],
            "latent_image": ["188", 0],  # Empty latent!
            "seed": seed, "steps": steps, "cfg": 1,
            "sampler_name": "euler", "scheduler": "simple",
            "denoise": 1.0  # Full denoise for new generation
        }},
        
        # Decode and save
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["31", 0], "vae": ["39", 0]}},
        "136": {"class_type": "SaveImage", "inputs": {
            "images": ["8", 0], "filename_prefix": f"pattern_{job_id}"
        }}
    })
    return workflow

# =============================================================================
# WORKFLOW 2: CHANGE MATERIAL (1 image → different fabric)
# =============================================================================

def build_change_material(image1, image2, prompt, negative_prompt, seed, steps, guidance, structure_strength, width, height, job_id):
    """Change material/fabric type while preserving design"""
    denoise = 1 - (structure_strength * 0.5)  # 0.5 structure → 0.75 denoise
    
    workflow = get_model_loaders()
    workflow.update(get_text_encoding(prompt, negative_prompt))
    
    workflow.update({
        "142": {"class_type": "LoadImage", "inputs": {"image": image1}},
        "42": {"class_type": "FluxKontextImageScale", "inputs": {"image": ["142", 0]}},
        "124": {"class_type": "VAEEncode", "inputs": {"pixels": ["42", 0], "vae": ["39", 0]}},
        
        "177": {"class_type": "ReferenceLatent", "inputs": {
            "conditioning": ["6", 0], "latent": ["124", 0]
        }},
        "35": {"class_type": "FluxGuidance", "inputs": {
            "conditioning": ["177", 0], "guidance": guidance
        }},
        
        # Use encoded latent with partial denoise to preserve structure
        "31": {"class_type": "KSampler", "inputs": {
            "model": ["37", 0],
            "positive": ["35", 0],
            "negative": ["135", 0],
            "latent_image": ["124", 0],  # Encoded image
            "seed": seed, "steps": steps, "cfg": 1,
            "sampler_name": "euler", "scheduler": "simple",
            "denoise": denoise
        }},
        
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["31", 0], "vae": ["39", 0]}},
        "136": {"class_type": "SaveImage", "inputs": {
            "images": ["8", 0], "filename_prefix": f"material_{job_id}"
        }}
    })
    return workflow

# =============================================================================
# WORKFLOW 3: MERGE IMAGES (person + scene → composite)
# =============================================================================

def build_merge_images(image1, image2, prompt, negative_prompt, seed, steps, guidance, structure_strength, width, height, job_id):
    """Merge two images - put garment from image2 onto person from image1
    
    Key difference from apply_pattern:
    - Uses IMAGE1 (person) as base latent with partial denoise
    - This PRESERVES the person while changing their clothes
    """
    # Higher guidance for better instruction following
    guidance = max(guidance, 3.5)
    
    # Partial denoise to preserve person structure while changing clothes
    # 0.85 denoise = keep person pose/face, change clothes
    denoise = 0.85
    
    workflow = get_model_loaders()
    workflow.update(get_text_encoding(prompt, negative_prompt))
    
    # Load both images
    workflow["142"] = {"class_type": "LoadImage", "inputs": {"image": image1}}  # Person
    if image2:
        workflow["147"] = {"class_type": "LoadImage", "inputs": {"image": image2}}  # Garment
        workflow["146"] = {"class_type": "ImageStitch", "inputs": {
            "image1": ["142", 0], "image2": ["147", 0],
            "direction": "right", "match_image_size": True,
            "feathering": 0, "spacing_width": 0, "spacing_color": "white"
        }}
        ref_source = ["146", 0]
    else:
        ref_source = ["142", 0]
    
    workflow.update({
        # Scale stitched reference
        "42": {"class_type": "FluxKontextImageScale", "inputs": {"image": ref_source}},
        "124": {"class_type": "VAEEncode", "inputs": {"pixels": ["42", 0], "vae": ["39", 0]}},
        
        # Also encode JUST the person image for base latent
        "person_scale": {"class_type": "FluxKontextImageScale", "inputs": {"image": ["142", 0]}},
        "person_latent": {"class_type": "VAEEncode", "inputs": {"pixels": ["person_scale", 0], "vae": ["39", 0]}},
        
        # ReferenceLatent uses the STITCHED image for conditioning
        "177": {"class_type": "ReferenceLatent", "inputs": {
            "conditioning": ["6", 0], "latent": ["124", 0]
        }},
        "35": {"class_type": "FluxGuidance", "inputs": {
            "conditioning": ["177", 0], "guidance": guidance
        }},
        
        # KSampler uses PERSON latent as base (not empty!)
        # This preserves person while applying the garment
        "31": {"class_type": "KSampler", "inputs": {
            "model": ["37", 0],
            "positive": ["35", 0],
            "negative": ["135", 0],
            "latent_image": ["person_latent", 0],  # Person as base!
            "seed": seed, "steps": steps, "cfg": 1,
            "sampler_name": "euler", "scheduler": "simple",
            "denoise": denoise  # Partial denoise preserves person
        }},
        
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["31", 0], "vae": ["39", 0]}},
        "136": {"class_type": "SaveImage", "inputs": {
            "images": ["8", 0], "filename_prefix": f"merge_{job_id}"
        }}
    })
    return workflow

# =============================================================================
# WORKFLOW 4: MODEL MOCKUP (design → on model for Instagram)
# =============================================================================

def build_model_mockup(image1, image2, prompt, negative_prompt, seed, steps, guidance, structure_strength, width, height, job_id):
    """Put design on fashion model for Instagram"""
    workflow = get_model_loaders()
    workflow.update(get_text_encoding(prompt, negative_prompt))
    
    workflow.update({
        "142": {"class_type": "LoadImage", "inputs": {"image": image1}},
        "42": {"class_type": "FluxKontextImageScale", "inputs": {"image": ["142", 0]}},
        "124": {"class_type": "VAEEncode", "inputs": {"pixels": ["42", 0], "vae": ["39", 0]}},
        
        "177": {"class_type": "ReferenceLatent", "inputs": {
            "conditioning": ["6", 0], "latent": ["124", 0]
        }},
        "35": {"class_type": "FluxGuidance", "inputs": {
            "conditioning": ["177", 0], "guidance": guidance
        }},
        
        # Use empty latent for creative model generation
        "188": {"class_type": "EmptySD3LatentImage", "inputs": {
            "width": width, "height": height, "batch_size": 1
        }},
        
        "31": {"class_type": "KSampler", "inputs": {
            "model": ["37", 0],
            "positive": ["35", 0],
            "negative": ["135", 0],
            "latent_image": ["188", 0],  # Empty for new scene
            "seed": seed, "steps": steps, "cfg": 1,
            "sampler_name": "euler", "scheduler": "simple",
            "denoise": 1.0
        }},
        
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["31", 0], "vae": ["39", 0]}},
        "136": {"class_type": "SaveImage", "inputs": {
            "images": ["8", 0], "filename_prefix": f"mockup_{job_id}"
        }}
    })
    return workflow

# =============================================================================
# WORKFLOW 5: STYLE TRANSFER (apply art style)
# =============================================================================

def build_style_transfer(image1, image2, prompt, negative_prompt, seed, steps, guidance, structure_strength, width, height, job_id):
    """Apply artistic style from image2 to image1"""
    return build_apply_pattern(image1, image2, prompt, negative_prompt, seed, steps, guidance, structure_strength, width, height, job_id)

# =============================================================================
# WORKFLOW 6: EXTRACT PATTERN (garment photo → flat tileable pattern)
# =============================================================================

def build_extract_pattern(image1, image2, prompt, negative_prompt, seed, steps, guidance, structure_strength, width, height, job_id):
    """Extract pattern from garment photo to flat tileable surface"""
    # High structure to preserve pattern details
    denoise = 0.7
    
    workflow = get_model_loaders()
    workflow.update(get_text_encoding(prompt, negative_prompt))
    
    workflow.update({
        "142": {"class_type": "LoadImage", "inputs": {"image": image1}},
        "42": {"class_type": "FluxKontextImageScale", "inputs": {"image": ["142", 0]}},
        "124": {"class_type": "VAEEncode", "inputs": {"pixels": ["42", 0], "vae": ["39", 0]}},
        
        "177": {"class_type": "ReferenceLatent", "inputs": {
            "conditioning": ["6", 0], "latent": ["124", 0]
        }},
        "35": {"class_type": "FluxGuidance", "inputs": {
            "conditioning": ["177", 0], "guidance": guidance
        }},
        
        # Square output for tileable pattern
        "188": {"class_type": "EmptySD3LatentImage", "inputs": {
            "width": 1024, "height": 1024, "batch_size": 1
        }},
        
        "31": {"class_type": "KSampler", "inputs": {
            "model": ["37", 0],
            "positive": ["35", 0],
            "negative": ["135", 0],
            "latent_image": ["188", 0],
            "seed": seed, "steps": steps, "cfg": 1,
            "sampler_name": "euler", "scheduler": "simple",
            "denoise": denoise
        }},
        
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["31", 0], "vae": ["39", 0]}},
        "136": {"class_type": "SaveImage", "inputs": {
            "images": ["8", 0], "filename_prefix": f"extract_{job_id}"
        }}
    })
    return workflow

# =============================================================================
# WORKFLOW 7: CREATIVE EDIT (general purpose)
# =============================================================================

def build_creative_edit(image1, image2, prompt, negative_prompt, seed, steps, guidance, structure_strength, width, height, job_id):
    """General purpose image editing"""
    denoise = 1 - (structure_strength * 0.7)
    
    workflow = get_model_loaders()
    workflow.update(get_text_encoding(prompt, negative_prompt))
    
    # Check if we have 2 images
    if image2:
        workflow["142"] = {"class_type": "LoadImage", "inputs": {"image": image1}}
        workflow["147"] = {"class_type": "LoadImage", "inputs": {"image": image2}}
        workflow["146"] = {"class_type": "ImageStitch", "inputs": {
            "image1": ["142", 0], "image2": ["147", 0],
            "direction": "right", "match_image_size": True,
            "feathering": 0, "spacing_width": 0, "spacing_color": "white"
        }}
        ref_source = ["146", 0]
    else:
        workflow["142"] = {"class_type": "LoadImage", "inputs": {"image": image1}}
        ref_source = ["142", 0]
    
    workflow.update({
        "42": {"class_type": "FluxKontextImageScale", "inputs": {"image": ref_source}},
        "124": {"class_type": "VAEEncode", "inputs": {"pixels": ["42", 0], "vae": ["39", 0]}},
        
        "177": {"class_type": "ReferenceLatent", "inputs": {
            "conditioning": ["6", 0], "latent": ["124", 0]
        }},
        "35": {"class_type": "FluxGuidance", "inputs": {
            "conditioning": ["177", 0], "guidance": guidance
        }},
        
        # Use structure_strength to decide between preserve vs create
        "31": {"class_type": "KSampler", "inputs": {
            "model": ["37", 0],
            "positive": ["35", 0],
            "negative": ["135", 0],
            "latent_image": ["124", 0],  # Encoded for preservation
            "seed": seed, "steps": steps, "cfg": 1,
            "sampler_name": "euler", "scheduler": "simple",
            "denoise": denoise
        }},
        
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["31", 0], "vae": ["39", 0]}},
        "136": {"class_type": "SaveImage", "inputs": {
            "images": ["8", 0], "filename_prefix": f"edit_{job_id}"
        }}
    })
    return workflow

# =============================================================================
# WORKFLOW ROUTER
# =============================================================================

WORKFLOW_BUILDERS = {
    'apply_pattern': build_apply_pattern,
    'change_material': build_change_material,
    'merge_images': build_merge_images,
    'model_mockup': build_model_mockup,
    'style_transfer': build_style_transfer,
    'extract_pattern': build_extract_pattern,
    'creative_edit': build_creative_edit,
}

# =============================================================================
# UTILITIES
# =============================================================================

async def wait_for_completion(prompt_id, timeout=120):
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
    if not webhook_url:
        return
        
    payload = {'success': success, 'job_id': job_id, 'is_upscale': is_upscale}
    
    if success and filename:
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
    print("🚀 FLUX Kontext Worker v2.0")
    print(f"📋 Available workflows: {list(WORKFLOW_BUILDERS.keys())}")
    print("📡 Run: npx localtunnel --port 8000 --subdomain textile-gpu-worker")
    uvicorn.run(app, host='0.0.0.0', port=8000)
