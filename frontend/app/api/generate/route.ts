import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Generation from "@/models/Generation";
import { authOptions } from "@/lib/auth";
import { generateWithFal } from "@/lib/fal-ai";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const body = await request.json();
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
    } = body;

    if (!image || !prompt) {
      return NextResponse.json(
        { error: "Image and prompt are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const creditsNeeded = num_variations || 1;
    if (user.credits < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${creditsNeeded} credits but have ${user.credits}.` },
        { status: 403 }
      );
    }

    const numImages = num_variations || 1;
    const variations = [];

    for (let i = 0; i < numImages; i++) {
      try {
        const { images, seed: resultSeed, executionTime } = await generateWithFal({
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
        });

        const imageUrl = images[0]?.url || "";

        const generation = await Generation.create({
          userId: user._id,
          prompt,
          referenceImageUrl: imageUrl,
          generatedImageUrl: imageUrl,
          status: 'completed',
          modelVersion: 'seedream-v4',
          backend: 'fal-ai',
          generationTime: executionTime,
          workflowType: workflow_type || "creative_edit",
        });

        variations.push({
          id: generation._id.toString(),
          status: 'completed',
          imageUrl,
          seed: resultSeed,
        });
      } catch (error) {
        console.error(`Error generating variation ${i}:`, error);
        variations.push({
          id: `error-${i}`,
          status: 'failed',
          error: 'Generation failed',
        });
      }
    }

    await user.deductCredits(variations.length);

    return NextResponse.json({
      success: true,
      variations,
      model: "seedream-v4",
      backend: "fal-ai",
      creditsRemaining: user.credits,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
