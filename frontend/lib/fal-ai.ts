import { fal } from "@fal-ai/client"

function base64ToBlob(base64: string, mimeType = "image/png"): Blob {
  const binaryStr = atob(base64.replace(/^data:image\/\w+;base64,/, ""))
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

const MODEL_MAP: Record<string, string> = {
  creative_edit: "fal-ai/seedream-v4",
  apply_pattern: "fal-ai/seedream-v4",
  change_material: "fal-ai/seedream-v4",
  style_transfer: "fal-ai/seedream-v4",
  color_swap: "fal-ai/seedream-v4",
  background_change: "fal-ai/flux-kontext-pro",
  merge_images: "fal-ai/nanobanana",
  model_mockup: "fal-ai/fashn/tryon/v1.6",
  print_placement: "fal-ai/flux-kontext-pro",
  batch_colorways: "fal-ai/seedream-v4",
  extract_pattern: "fal-ai/seedream-v4",
  fabric_texture: "fal-ai/seedream-v4",
  embroidery_effect: "fal-ai/seedream-v4",
  draping_sim: "fal-ai/seedream-v4",
  age_wear: "fal-ai/seedream-v4",
}

function getModelForWorkflow(t: string): string {
  return MODEL_MAP[t] || "fal-ai/seedream-v4"
}

export interface FalInput {
  prompt: string
  image_base64?: string
  image2_base64?: string
  negative_prompt?: string
  guidance?: number
  num_images?: number
  seed?: number
  aspect_ratio?: string
  workflow_type?: string
  steps?: number
}

export async function generateWithFal(input: FalInput) {
  const modelId = getModelForWorkflow(input.workflow_type || "creative_edit")

  let image_url: string | undefined
  if (input.image_base64) {
    const blob = base64ToBlob(input.image_base64)
    image_url = await fal.storage.upload(blob)
  }

  const payload: Record<string, unknown> = {
    prompt: input.prompt,
    image_url,
    negative_prompt: input.negative_prompt || "",
    guidance_scale: input.guidance || 3.5,
    num_images: input.num_images || 1,
    aspect_ratio: input.aspect_ratio || "1:1",
    num_inference_steps: input.steps || 25,
  }

  if (input.seed !== undefined) {
    payload.seed = input.seed
  }

  if (input.image2_base64) {
    const blob2 = base64ToBlob(input.image2_base64)
    payload.image2_url = await fal.storage.upload(blob2)
  }

  if (modelId === "fal-ai/flux-kontext-pro") {
    payload.guidance_scale = input.guidance || 3.0
    payload.num_inference_steps = input.steps || 20
  }

  const result = await fal.subscribe(modelId, {
    input: payload,
    logs: true,
  })

  const images = (result.data?.images ?? []) as Array<{ url: string; width?: number; height?: number }>
  const seed = (result.data as any)?.seed ?? input.seed

  return {
    images,
    seed,
    executionTime: Math.round(((result.data as any)?.timings?.inference || 0) / 1000),
    falRequestId: result.requestId,
  }
}
