"""
ComfyUI API Client
Handles communication with the ComfyUI server to execute workflows
"""

import json
import httpx
import asyncio
import uuid
from pathlib import Path
from typing import Optional
import base64


COMFYUI_URL = "http://localhost:8188"


async def get_system_stats() -> dict:
    """Check if ComfyUI is running and get system stats"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{COMFYUI_URL}/system_stats")
        return response.json()


async def upload_image(image_data: bytes, filename: str) -> str:
    """Upload an image to ComfyUI and return the filename"""
    async with httpx.AsyncClient() as client:
        files = {
            "image": (filename, image_data, "image/png"),
            "overwrite": (None, "true"),
        }
        response = await client.post(
            f"{COMFYUI_URL}/upload/image",
            files=files
        )
        result = response.json()
        return result.get("name", filename)


async def queue_prompt(workflow: dict, client_id: str) -> str:
    """Queue a workflow for execution and return the prompt_id"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{COMFYUI_URL}/prompt",
            json={
                "prompt": workflow,
                "client_id": client_id
            }
        )
        result = response.json()
        return result.get("prompt_id")


async def get_history(prompt_id: str) -> Optional[dict]:
    """Get the execution history for a prompt"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{COMFYUI_URL}/history/{prompt_id}")
        history = response.json()
        return history.get(prompt_id)


async def get_image(filename: str, subfolder: str = "", folder_type: str = "output") -> bytes:
    """Download a generated image from ComfyUI"""
    async with httpx.AsyncClient() as client:
        params = {
            "filename": filename,
            "subfolder": subfolder,
            "type": folder_type
        }
        response = await client.get(f"{COMFYUI_URL}/view", params=params)
        return response.content


def load_workflow(workflow_name: str = "flatlay_api.json") -> dict:
    """Load a workflow JSON file"""
    workflow_path = Path("/app/workflows") / workflow_name
    with open(workflow_path, "r") as f:
        return json.load(f)


def prepare_workflow(
    workflow: dict,
    input_image_name: str,
    prompt: str,
    seed: Optional[int] = None,
    guidance: float = 3.0,
    denoise: float = 0.98,
    steps: int = 25
) -> dict:
    """
    Prepare a workflow by setting the input parameters
    
    Args:
        workflow: The base workflow dict
        input_image_name: Name of the uploaded input image
        prompt: The text prompt for generation
        seed: Random seed (None for random)
        guidance: Guidance scale (default 3.0)
        denoise: Denoise strength (default 0.98)
        steps: Number of sampling steps (default 25)
    """
    # Deep copy the workflow
    import copy
    prepared = copy.deepcopy(workflow)
    
    # Find and update nodes by type
    for node_id, node in prepared.items():
        if not isinstance(node, dict):
            continue
            
        class_type = node.get("class_type", "")
        
        # Update LoadImage node with input image
        if class_type == "LoadImage":
            node["inputs"]["image"] = input_image_name
            
        # Update CLIPTextEncode (Prompt) node
        elif class_type == "CLIPTextEncode":
            node["inputs"]["text"] = prompt
            
        # Update KSampler parameters
        elif class_type == "KSampler":
            if seed is not None:
                node["inputs"]["seed"] = seed
            node["inputs"]["cfg"] = guidance
            node["inputs"]["denoise"] = denoise
            node["inputs"]["steps"] = steps
            
        # Update FluxGuidance
        elif class_type == "FluxGuidance":
            node["inputs"]["guidance"] = guidance
    
    return prepared


async def execute_workflow(
    input_image_data: bytes,
    prompt: str,
    seed: Optional[int] = None,
    guidance: float = 3.0,
    denoise: float = 0.98,
    steps: int = 25,
    workflow_name: str = "flatlay_api.json"
) -> dict:
    """
    Execute a complete workflow and return the result
    
    Returns:
        dict with 'success', 'image_data', 'filename', 'execution_time'
    """
    import time
    start_time = time.time()
    
    # Generate unique IDs
    client_id = str(uuid.uuid4())
    input_filename = f"input_{uuid.uuid4().hex[:8]}.png"
    
    try:
        # 1. Upload input image
        uploaded_name = await upload_image(input_image_data, input_filename)
        
        # 2. Load and prepare workflow
        workflow = load_workflow(workflow_name)
        prepared_workflow = prepare_workflow(
            workflow,
            input_image_name=uploaded_name,
            prompt=prompt,
            seed=seed,
            guidance=guidance,
            denoise=denoise,
            steps=steps
        )
        
        # 3. Convert workflow to API format (node_id: node_data)
        api_workflow = {}
        for node in prepared_workflow.get("nodes", []):
            node_id = str(node["id"])
            api_workflow[node_id] = {
                "class_type": node["type"],
                "inputs": {}
            }
            # Map widget values to inputs
            if "widgets_values" in node:
                # This is simplified - full implementation would need proper mapping
                pass
        
        # For our simplified workflow, use the prepared dict directly
        # (assuming flatlay_api.json is in API format)
        
        # 4. Queue the prompt
        prompt_id = await queue_prompt(prepared_workflow, client_id)
        
        # 5. Poll for completion
        max_wait = 120  # seconds
        poll_interval = 2  # seconds
        elapsed = 0
        
        while elapsed < max_wait:
            history = await get_history(prompt_id)
            
            if history and "outputs" in history:
                # Find the output image
                for node_id, output in history["outputs"].items():
                    if "images" in output:
                        image_info = output["images"][0]
                        filename = image_info["filename"]
                        subfolder = image_info.get("subfolder", "")
                        
                        # Download the image
                        image_data = await get_image(filename, subfolder)
                        
                        execution_time = time.time() - start_time
                        
                        return {
                            "success": True,
                            "image_data": image_data,
                            "filename": filename,
                            "execution_time": execution_time,
                            "prompt_id": prompt_id
                        }
            
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
        
        # Timeout
        return {
            "success": False,
            "error": "Workflow execution timed out",
            "execution_time": time.time() - start_time
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "execution_time": time.time() - start_time
        }
