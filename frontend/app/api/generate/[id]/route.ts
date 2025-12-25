import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import Job from "@/models/Job";
import Generation from "@/models/Generation";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

/**
 * GET /api/generate/[id]
 * Poll for job/generation status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find the generation - use lean() to get fresh data
    const generation = await Generation.findById(id).populate('jobId').lean();
    
    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    // Build response based on status
    const response: any = {
      id: generation._id.toString(),
      status: generation.status,
      prompt: generation.prompt,
      createdAt: generation.createdAt,
    };

    console.log(`📊 Poll status for ${id}: ${generation.status}`);

    if (generation.status === 'completed') {
      // Return image URL
      if (generation.generatedImageId) {
        response.imageUrl = `/api/images/${generation.generatedImageId}`;
      } else if (generation.generatedImageUrl) {
        response.imageUrl = generation.generatedImageUrl;
      }
      response.executionTime = generation.generationTime;
      
      // Upscale info
      response.upscaleStatus = generation.upscaleStatus || 'none';
      if (generation.upscaledImageId) {
        response.upscaledImageUrl = `/api/images/${generation.upscaledImageId}`;
      }
    } else if (generation.status === 'failed' && generation.jobId) {
      const job = generation.jobId as any;
      response.error = job.error?.message || 'Generation failed';
    } else if (generation.status === 'processing' && generation.jobId) {
      // Include queue position estimate - only count jobs ahead of this one
      const job = generation.jobId as any;
      const pendingCount = await Job.countDocuments({ 
        status: { $in: ['pending', 'processing'] },
        createdAt: { $lt: job.createdAt }
      });
      response.queuePosition = pendingCount + 1;
      response.estimatedWait = (pendingCount + 1) * 35; // ~35s per job
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

