const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4/accounts"

const MODEL = "@cf/stabilityai/stable-diffusion-xl-base-1.0"

const IMAGE_WIDTH = 1024
const IMAGE_HEIGHT = 1024

const RATE_LIMIT_MS = 1100

export interface CloudflareInput {
  prompt: string
  negative_prompt?: string
  guidance?: number
  num_images?: number
  seed?: number
  steps?: number
}

export async function generateWithCloudflare(input: CloudflareInput) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!accountId || !apiToken) {
    throw new Error(
      "Cloudflare AI is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in your environment."
    )
  }

  const url = `${CLOUDFLARE_API_BASE}/${accountId}/ai/run/${encodeURIComponent(MODEL)}`
  const numImages = Math.max(1, input.num_images || 1)
  const images: Array<{ url: string; width: number; height: number }> = []
  let lastSeed = input.seed
  const startTime = Date.now()

  for (let i = 0; i < numImages; i++) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS))
    }

    const currentSeed = lastSeed !== undefined ? lastSeed + i : undefined

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: input.prompt,
        negative_prompt: input.negative_prompt || "",
        guidance_scale: input.guidance ?? 7.5,
        num_steps: input.steps ?? 20,
        seed: currentSeed,
        response_format: "json",
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "Unknown error")
      throw new Error(`Cloudflare AI error (${res.status}): ${errorBody}`)
    }

    const data = await res.json()

    if (!data.success) {
      const msg = data.errors?.[0]?.message || "Cloudflare AI request failed"
      throw new Error(msg)
    }

    const base64Image: string | undefined = data.result?.image
    if (!base64Image) {
      throw new Error("Cloudflare AI returned no image data")
    }

    images.push({
      url: `data:image/png;base64,${base64Image}`,
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
    })

    lastSeed = currentSeed
  }

  const executionTime = Math.round((Date.now() - startTime) / 1000)

  return {
    images,
    seed: lastSeed,
    executionTime,
  }
}
