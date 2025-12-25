import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import Generation from "@/models/Generation";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { getWorkerUrl, isWorkerHealthy } from "@/lib/vastai";

export const dynamic = 'force-dynamic';

const API_SECRET = process.env.API_SECRET || "your-secret-key";
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * POST /api/upscale
 * Request on-demand upscaling of a generated image
 */
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
    const { generation_id } = body;

    if (!generation_id) {
      return NextResponse.json(
        { error: "generation_id is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the generation
    const generation = await Generation.findById(generation_id);
    
    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    // Check if already upscaled
    if (generation.upscaledImageId) {
      return NextResponse.json({
        success: true,
        message: "Already upscaled",
        upscaledImageUrl: `/api/images/${generation.upscaledImageId}`,
      });
    }

    // Check user credits (upscaling costs 1 credit)
    const user = await User.findOne({ email: session.user.email });
    if (!user || user.credits < 1) {
      return NextResponse.json(
        { error: "Insufficient credits for upscaling" },
        { status: 403 }
      );
    }

    // Get worker URL
    const workerUrl = await getWorkerUrl();
    
    if (!workerUrl) {
      return NextResponse.json(
        { error: "GPU worker not available" },
        { status: 503 }
      );
    }

    // Get the original image filename from the generation
    // The filename is stored in the output or we need to fetch it
    const originalFilename = generation.outputFilename || `out_${generation._id}_00001_.png`;

    // Send upscale request to worker
    const workerResponse = await fetch(`${workerUrl}/upscale/async`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Secret": API_SECRET,
      },
      body: JSON.stringify({
        job_id: generation._id.toString(),
        image_filename: originalFilename,
        webhook_url: `${WEBHOOK_BASE_URL}/api/webhook/comfyui`,
      }),
    });

    if (!workerResponse.ok) {
      return NextResponse.json(
        { error: "Failed to start upscaling" },
        { status: 500 }
      );
    }

    // Deduct credit
    user.credits -= 1;
    await user.save();

    // Update generation status
    generation.upscaleStatus = 'processing';
    await generation.save();

    return NextResponse.json({
      success: true,
      message: "Upscaling started",
      generationId: generation._id.toString(),
      creditsRemaining: user.credits,
    });

  } catch (error) {
    console.error("Upscale error:", error);
    return NextResponse.json(
      { error: "Failed to process upscale request" },
      { status: 500 }
    );
  }
}
