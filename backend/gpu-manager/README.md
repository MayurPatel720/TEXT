# GPU Manager Service for Render/Railway

This service manages your Vast.ai GPU instance:
- **Auto-starts** GPU when jobs are pending
- **Auto-stops** GPU after 10 min idle (saves ~$160/month!)
- Polls your MongoDB job queue every 30 seconds

## Deploy to Render (Recommended - Free tier available)

1. Go to [render.com](https://render.com)
2. Create account → New → **Background Worker**
3. Connect to your GitHub repo
4. Settings:
   - **Name**: gpu-manager
   - **Root Directory**: `backend/gpu-manager`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python gpu_manager.py`
5. Add Environment Variables (from your `.env.example`)
6. Deploy!

Cost: **$7/month** (Starter plan for always-on worker)

## Deploy to Railway (Alternative)

1. Go to [railway.app](https://railway.app)
2. Create project → Deploy from GitHub
3. Select `backend/gpu-manager` folder
4. Railway auto-detects Python
5. Add env vars in dashboard
6. Deploy!

Cost: **~$5/month** (usage-based)

## Required Environment Variables

```
VASTAI_API_KEY=your-vastai-api-key
VASTAI_INSTANCE_ID=29170188
WEBHOOK_BASE_URL=https://your-app.vercel.app
API_SECRET=your-secret-key
MONGODB_URI=your-mongodb-uri
IDLE_TIMEOUT_MINUTES=10
POLL_INTERVAL_SECONDS=30
```

## How It Works

```
Every 30 seconds:
  1. Check MongoDB for pending jobs
  2. If jobs pending AND GPU stopped → Start GPU
  3. If jobs pending AND GPU running → Send to worker
  4. If no jobs AND GPU running for 10+ min → Stop GPU
```

## Getting Your Vast.ai API Key

1. Go to https://cloud.vast.ai/account/
2. Click "Show API Key"
3. Copy and save it
