import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import Generation from "@/models/Generation";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const generation = await Generation.findById(id).lean();

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    const response: Record<string, unknown> = {
      id: generation._id.toString(),
      status: generation.status,
      prompt: generation.prompt,
      createdAt: generation.createdAt,
    };

    if (generation.status === 'completed') {
      response.imageUrl = generation.generatedImageUrl;
      response.executionTime = generation.generationTime;
      response.upscaleStatus = generation.upscaleStatus || 'none';
      response.upscaledImageUrl = generation.upscaledImageUrl;
      response.backend = 'fal-ai';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching generation:", error);
    return NextResponse.json(
      { error: "Failed to fetch generation status" },
      { status: 500 }
    );
  }
}

