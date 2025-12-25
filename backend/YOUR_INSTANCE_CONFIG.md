# Your Vast.ai Instance Configuration

## Instance Details
- **Instance ID**: `29170188`
- **Public IP**: `195.139.22.91`
- **Port Range**: `35028-35142`

## Find Your Worker Port

SSH into your instance and check which external port maps to 8000:

```bash
# In your Vast.ai terminal, check port mappings
echo $VAST_TCP_PORT_8000
```

Or check the Vast.ai console - look for port 8000 in the "Open Ports" section.

Typically:
- Port 8188 (ComfyUI) → External port ~35028
- Port 8000 (Worker) → You need to open this port!

## Open Port 8000

In Vast.ai console:
1. Click "Edit" on your instance
2. In "Ports to open", add: `8000`
3. Save and restart instance

## Set Autostop

```bash
# In your instance terminal
pip install vastai
vastai set api-key YOUR_VAST_API_KEY
vastai set autostop 29170188 600
```

## Your Vercel Environment Variables

Once worker is running, add these to Vercel:

```
VASTAI_API_KEY=your-vast-api-key
VASTAI_INSTANCE_ID=29170188
GPU_WORKER_URL=http://195.139.22.91:PORT_FOR_8000
API_SECRET=pick-a-secret-string
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

Replace `PORT_FOR_8000` with the external port mapped to 8000.
