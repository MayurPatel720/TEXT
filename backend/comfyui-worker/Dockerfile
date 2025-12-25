# ComfyUI Worker for Textile Design SaaS
# Optimized for FLUX Kontext Dev on RTX 4090 (Vast.ai)

FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV COMFYUI_PATH=/app/ComfyUI

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    curl \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Clone ComfyUI
RUN git clone https://github.com/comfyanonymous/ComfyUI.git

# Install ComfyUI dependencies
WORKDIR /app/ComfyUI
RUN pip install --no-cache-dir -r requirements.txt

# Install additional dependencies for our worker
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    python-multipart \
    pymongo \
    gridfs \
    httpx \
    Pillow

# Create model directories
RUN mkdir -p models/diffusion_models \
    && mkdir -p models/vae \
    && mkdir -p models/text_encoders \
    && mkdir -p models/upscale_models \
    && mkdir -p input \
    && mkdir -p output

# Download models (these will be cached in the Docker image)
# FLUX Kontext Dev (fp8 scaled - ~8GB)
RUN wget -O models/diffusion_models/flux1-dev-kontext_fp8_scaled.safetensors \
    "https://huggingface.co/Comfy-Org/flux1-kontext-dev_ComfyUI/resolve/main/split_files/diffusion_models/flux1-dev-kontext_fp8_scaled.safetensors"

# VAE
RUN wget -O models/vae/ae.safetensors \
    "https://huggingface.co/Comfy-Org/Lumina_Image_2.0_Repackaged/resolve/main/split_files/vae/ae.safetensors"

# CLIP text encoders
RUN wget -O models/text_encoders/clip_l.safetensors \
    "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors"

RUN wget -O models/text_encoders/t5xxl_fp8_e4m3fn_scaled.safetensors \
    "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn_scaled.safetensors"

# Copy our worker files
WORKDIR /app
COPY workflows/ /app/workflows/
COPY worker.py /app/worker.py
COPY comfyui_api.py /app/comfyui_api.py

# Expose ports
# 8188 - ComfyUI web interface (optional, for debugging)
# 8000 - Our HTTP API
EXPOSE 8188 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
