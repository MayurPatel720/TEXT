# Vast.ai Auto-Stop Deployment (FREE - No VPS Needed!)

## 🎯 The Solution

Vast.ai has a **built-in autostop feature** that stops your instance after idle time. Combined with your Vercel app triggering instance start via API, you get automatic scaling for FREE!

**How it works:**
1. User generates → Vercel starts GPU via Vast.ai API
2. GPU runs your job → Webhook returns result
3. GPU auto-stops after 10 min idle → Saves money!

**Cost: $0 extra** (just GPU time when running)

---

## Step-by-Step Setup

### Step 1: Get Your Vast.ai API Key

1. Go to https://cloud.vast.ai/account/
2. Scroll to "API Key" section
3. Click "Show" and copy your key

### Step 2: Rent a GPU Instance

1. Go to https://cloud.vast.ai/
2. Click "Templates" → "Edit Image & Config"
3. Enter custom Docker image:
   ```
   pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
   ```
4. Select an RTX 4090 instance
5. Click "RENT"
6. Note your **Instance ID** (e.g., 29170188)

### Step 3: Enable Autostop

In Vast.ai console, find your instance and set:
- **Autostop**: 10 minutes (stops after 10 min idle)

Or via CLI:
```bash
vastai set autostop 29170188 600  # 600 seconds = 10 minutes
```

### Step 4: SSH and Setup ComfyUI

Open SSH/terminal to your instance:

```bash
# Install ComfyUI
cd /workspace
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
pip install -r requirements.txt

# Download FLUX Kontext Dev model (~8GB)
cd models/diffusion_models
wget -c "https://huggingface.co/Comfy-Org/flux1-kontext-dev_ComfyUI/resolve/main/split_files/diffusion_models/flux1-dev-kontext_fp8_scaled.safetensors"

# Download VAE
cd ../vae
wget -c "https://huggingface.co/Comfy-Org/Lumina_Image_2.0_Repackaged/resolve/main/split_files/vae/ae.safetensors"

# Download Text Encoders
cd ../text_encoders
wget -c "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors"
wget -c "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn_scaled.safetensors"
```

### Step 5: Setup Worker API

```bash
# Create worker directory
mkdir -p /workspace/worker/workflows
cd /workspace/worker

# Install dependencies
pip install fastapi uvicorn httpx pymongo Pillow python-multipart

# Download worker files from your GitHub repo
# OR copy-paste the files manually using nano
```

### Step 6: Create Startup Script

```bash
cat > /workspace/onstart.sh << 'EOF'
#!/bin/bash

# Start ComfyUI
cd /workspace/ComfyUI
nohup python main.py --listen 0.0.0.0 --port 8188 &

# Wait for ComfyUI
sleep 30

# Start Worker API
cd /workspace/worker
python -m uvicorn worker:app --host 0.0.0.0 --port 8000
EOF

chmod +x /workspace/onstart.sh
```

### Step 7: Set Onstart Command

In Vast.ai console:
1. Click "Edit" on your instance
2. Set **On-start Script**: `/workspace/onstart.sh`
3. Save

Now every time the instance starts, it auto-runs your worker!

### Step 8: Update Vercel Environment

Add to your Vercel project:
```
VASTAI_API_KEY=your-api-key
VASTAI_INSTANCE_ID=29170188
GPU_WORKER_URL=http://YOUR_VAST_IP:8000
API_SECRET=your-secret-key
```

---

## How Auto-Start Works

When a user generates, your Vercel API:
1. Checks if GPU is running
2. If not → Calls Vast.ai API to start
3. Waits for worker to be healthy
4. Sends the job

The GPU auto-stops after 10 min idle. **No VPS or Render needed!**

---

## Your Costs

| Scenario | Cost |
|----------|------|
| GPU running | $0.315/hr |
| GPU stopped (disk storage) | $0.365/day (~$11/month) |
| No extra VPS | $0 |

**Monthly estimate for 100-500 images: ~$15-20 total**

---

## Test It

1. Stop your instance in Vast.ai console
2. Go to your app and generate an image
3. Watch the instance auto-start in Vast.ai console
4. Image generates
5. After 10 min, instance auto-stops

🎉 **Automatic scaling, zero extra cost!**
