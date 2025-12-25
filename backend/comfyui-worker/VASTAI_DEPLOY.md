# Vast.ai Deployment Guide (No Local Docker Needed)

## Step 1: Prepare Files

Upload these files to a GitHub repo or directly to Vast.ai:
- All files in `backend/comfyui-worker/`

## Step 2: Rent a GPU on Vast.ai

1. Go to https://cloud.vast.ai
2. Click "Search" to find GPUs
3. Filter by:
   - GPU: RTX 4090
   - VRAM: 24GB+
   - Disk: 50GB+
4. Click "RENT" on a good option
5. Note your **Instance ID** (shown in console)

## Step 3: Access Your Instance

1. In Vast.ai console, click "Connect" on your instance
2. Use the provided SSH command or web terminal

## Step 4: Install ComfyUI (One-Time Setup)

SSH into your instance and run:

```bash
# Clone ComfyUI
cd /workspace
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Install dependencies
pip install -r requirements.txt

# Download FLUX Kontext Dev model
cd models/diffusion_models
wget https://huggingface.co/Comfy-Org/flux1-kontext-dev_ComfyUI/resolve/main/split_files/diffusion_models/flux1-dev-kontext_fp8_scaled.safetensors

# Download VAE
cd ../vae
wget https://huggingface.co/Comfy-Org/Lumina_Image_2.0_Repackaged/resolve/main/split_files/vae/ae.safetensors

# Download Text Encoders
cd ../text_encoders
wget https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors
wget https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn_scaled.safetensors

# Go back to workspace
cd /workspace
```

## Step 5: Setup Worker API

```bash
# Clone or upload your worker files
mkdir -p /workspace/worker
cd /workspace/worker

# Create worker.py (paste the content)
nano worker.py

# Create comfyui_api.py (paste the content)
nano comfyui_api.py

# Create workflows folder
mkdir workflows

# Create workflow file
nano workflows/flatlay_api.json

# Install worker dependencies
pip install fastapi uvicorn httpx pymongo Pillow python-multipart
```

## Step 6: Create Startup Script

```bash
nano /workspace/start.sh
```

Paste:
```bash
#!/bin/bash

# Start ComfyUI in background
cd /workspace/ComfyUI
python main.py --listen 0.0.0.0 --port 8188 &

# Wait for ComfyUI
sleep 30

# Start Worker API
cd /workspace/worker
python -m uvicorn worker:app --host 0.0.0.0 --port 8000
```

Make executable:
```bash
chmod +x /workspace/start.sh
```

## Step 7: Run the Worker

```bash
/workspace/start.sh
```

## Step 8: Get Your Worker URL

Your worker URL is:
```
http://YOUR_VAST_IP:8000
```

Find YOUR_VAST_IP in the Vast.ai console (the public IP).

## Step 9: Test It

```bash
curl http://YOUR_VAST_IP:8000/health
```

Should return: `{"status": "healthy", ...}`

---

## Quick Reference

| What | Where |
|------|-------|
| ComfyUI | http://YOUR_IP:8188 |
| Worker API | http://YOUR_IP:8000 |
| Health Check | http://YOUR_IP:8000/health |

## Troubleshooting

**ComfyUI not starting?**
- Check VRAM: `nvidia-smi`
- Check logs in terminal

**API not responding?**
- Make sure port 8000 is open in Vast.ai dashboard
- Check if uvicorn started

**Models not loading?**
- Verify files exist in correct folders
- Check model file sizes (should be several GB)
