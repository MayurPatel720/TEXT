# ComfyUI Worker Deployment Guide

## Overview

This directory contains the GPU worker for textile design generation using FLUX Kontext Dev on Vast.ai.

## Prerequisites

- Docker installed
- Vast.ai account with RTX 4090 instance
- MongoDB Atlas database
- Your Vercel app deployed

## Files

```
comfyui-worker/
├── Dockerfile          # Docker container definition
├── start.sh            # Startup script
├── worker.py           # HTTP API server (FastAPI)
├── comfyui_api.py      # ComfyUI API client
├── requirements.txt    # Python dependencies
├── .env.example        # Environment template
└── workflows/
    └── flatlay_api.json # Textile design workflow
```

## Deployment Steps

### 1. Build Docker Image (locally first)

```bash
cd backend/comfyui-worker
docker build -t textile-worker:latest .
```

### 2. Test Locally (optional)

```bash
docker run -p 8000:8000 -p 8188:8188 \
  -e API_SECRET=test-secret \
  -e WEBHOOK_URL=http://host.docker.internal:3000/api/webhook/comfyui \
  --gpus all \
  textile-worker:latest
```

### 3. Push to Docker Hub

```bash
docker tag textile-worker:latest YOUR_USERNAME/textile-worker:latest
docker push YOUR_USERNAME/textile-worker:latest
```

### 4. Deploy to Vast.ai

1. Go to https://cloud.vast.ai/
2. Select your RTX 4090 instance (or rent one)
3. Click "Edit" on the instance
4. Set Docker image: `YOUR_USERNAME/textile-worker:latest`
5. Set environment variables:
   ```
   API_SECRET=your-32-char-secret
   WEBHOOK_URL=https://your-app.vercel.app/api/webhook/comfyui
   ```
6. Open ports: `8000, 8188`
7. Start the instance

### 5. Configure Vercel

Add these environment variables to your Vercel project:

```
GPU_WORKER_URL=http://YOUR_VAST_AI_IP:8000
API_SECRET=your-32-char-secret
```

## API Endpoints

### Health Check
```
GET /health
```

### Sync Generation (blocking)
```
POST /generate
Body: {
  "job_id": "string",
  "image_base64": "base64-encoded-image",
  "prompt": "your prompt",
  "seed": 12345,        // optional
  "guidance": 3.0,      // optional
  "steps": 25           // optional
}
```

### Async Generation (recommended)
```
POST /generate/async
Body: same as above
```
Calls webhook on completion.

## Cost Optimization

### On-Demand Mode (recommended for <1000 images/month)

1. Keep GPU instance off when idle
2. Start when jobs are pending
3. Auto-stop after 10 min idle

Estimated cost: ~$15-20/month

### Always-On Mode (for high volume)

Keep instance running 24/7.

Cost: $6/day = ~$180/month

## Monitoring

- Check logs: Click "LOG" button in Vast.ai console
- Health endpoint: `curl http://YOUR_IP:8000/health`
- ComfyUI web UI: `http://YOUR_IP:8188` (for debugging)

## Troubleshooting

### Worker not responding
1. Check if instance is running in Vast.ai
2. Check Docker logs
3. Ensure ports 8000/8188 are open

### Generation taking too long
1. Check GPU utilization in logs
2. Verify VRAM is sufficient (need ~20GB)
3. Check if model loaded correctly

### Webhook not received
1. Verify WEBHOOK_URL is correct
2. Check Vercel function logs
3. Ensure API_SECRET matches on both ends
