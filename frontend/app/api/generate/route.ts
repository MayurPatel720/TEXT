import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Generation from "@/models/Generation"
import { authOptions } from "@/lib/auth"
import { generateWithFal } from "@/lib/fal-ai"
import { generateWithCloudflare } from "@/lib/cloudflare-ai"
import { getActiveBackend } from "@/lib/appConfig"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      image,
      image2,
      prompt,
      negative_prompt,
      num_variations,
      seed,
      aspect_ratio,
      guidance,
      steps,
      workflow_type,
    } = body

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const activeBackend = await getActiveBackend()
    const isCloudflare = activeBackend === "cloudflare"
    const numImages = Math.max(1, num_variations || 1)

    if (!isCloudflare) {
      if (user.credits < numImages) {
        return NextResponse.json(
          {
            error: `Insufficient credits. You need ${numImages} credits but have ${user.credits}.`,
          },
          { status: 403 }
        )
      }
    }

    const variations: Array<{
      id: string
      status: string
      imageUrl?: string
      seed?: number
      error?: string
    }> = []

    for (let i = 0; i < numImages; i++) {
      try {
        let result: Awaited<ReturnType<typeof generateWithFal | typeof generateWithCloudflare>>

        if (isCloudflare) {
          result = await generateWithCloudflare({
            prompt,
            negative_prompt: negative_prompt || "",
            guidance: guidance || 7.5,
            num_images: 1,
            seed: seed ? seed + i : undefined,
            steps: steps || 20,
          })
        } else {
          result = await generateWithFal({
            prompt,
            image_base64: image,
            image2_base64: image2,
            negative_prompt: negative_prompt || "",
            guidance: guidance || 3.5,
            num_images: 1,
            seed: seed ? seed + i : undefined,
            aspect_ratio: aspect_ratio || "1:1",
            workflow_type: workflow_type || "creative_edit",
            steps: steps || 25,
          })
        }

        const imageUrl = result.images[0]?.url || ""
        const modelVersion = isCloudflare ? "sdxl-base-1.0" : "seedream-v4"

        const generation = await Generation.create({
          userId: user._id,
          prompt,
          referenceImageUrl: image || "",
          generatedImageUrl: imageUrl,
          status: "completed",
          modelVersion,
          backend: activeBackend,
          generationTime: result.executionTime,
          workflowType: workflow_type || "creative_edit",
        })

        variations.push({
          id: generation._id.toString(),
          status: "completed",
          imageUrl,
          seed: result.seed,
        })
      } catch (error) {
        console.error(`Error generating variation ${i}:`, error)
        variations.push({
          id: `error-${i}`,
          status: "failed",
          error: error instanceof Error ? error.message : "Generation failed",
        })
      }
    }

    if (!isCloudflare) {
      const completedCount = variations.filter((v) => v.status === "completed").length
      if (completedCount > 0) {
        await user.deductCredits(completedCount)
      }
    }

    return NextResponse.json({
      success: true,
      variations,
      model: isCloudflare ? "sdxl-base-1.0" : "seedream-v4",
      backend: activeBackend,
      isFreeGeneration: isCloudflare,
      creditsRemaining: user.credits,
    })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
