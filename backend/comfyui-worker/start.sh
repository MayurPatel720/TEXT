#!/bin/bash

# Start ComfyUI in background
echo "Starting ComfyUI server..."
cd /app/ComfyUI
python main.py --listen 0.0.0.0 --port 8188 --disable-auto-launch &

# Wait for ComfyUI to be ready
echo "Waiting for ComfyUI to initialize..."
sleep 10

# Check if ComfyUI is running
until curl -s http://localhost:8188/system_stats > /dev/null; do
    echo "Waiting for ComfyUI..."
    sleep 5
done

echo "ComfyUI is ready!"

# Start our HTTP API worker
echo "Starting HTTP API worker..."
cd /app
python -m uvicorn worker:app --host 0.0.0.0 --port 8000

# Keep container running
wait
