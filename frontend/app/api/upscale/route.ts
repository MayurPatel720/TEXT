import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { fal } from "@fal-ai/client";
import connectDB from "@/lib/mongodb";
import Generation from "@/models/Generation";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

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
    const { generation_id } = body;

    if (!generation_id) {
      return NextResponse.json(
        { error: "generation_id is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const generation = await Generation.findById(generation_id);

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    if (generation.upscaledImageUrl) {
      return NextResponse.json({
        success: true,
        message: "Already upscaled",
        upscaledImageUrl: generation.upscaledImageUrl,
      });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user || user.credits < 1) {
      return NextResponse.json(
        { error: "Insufficient credits for upscaling" },
        { status: 403 }
      );
    }

    const result = await fal.subscribe("fal-ai/seedream-v4", {
      input: {
        prompt: "high quality detailed fabric texture, sharp focus, 4k resolution, professional textile photography",
        image_url: generation.generatedImageUrl,
        num_images: 1,
      },
      logs: true,
    });

    const upscaledUrl = ((result.data as any)?.images?.[0]?.url as string) || "";

    user.credits -= 1;
    await user.save();

    generation.upscaledImageUrl = upscaledUrl;
    generation.upscaleStatus = 'completed';
    await generation.save();

    return NextResponse.json({
      success: true,
      message: "Upscaling completed",
      upscaledImageUrl: upscaledUrl,
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
