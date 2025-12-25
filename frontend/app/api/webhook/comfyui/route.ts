import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Job from "@/models/Job";
import Generation from "@/models/Generation";
import { uploadImage } from "@/lib/gridfs";

export const dynamic = 'force-dynamic';

// Secret for webhook authentication
const API_SECRET = process.env.API_SECRET || "your-secret-key";

/**
 * POST /api/webhook/comfyui
 * Called by GPU worker when generation completes
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const secret = request.headers.get("X-API-Secret");
    if (secret !== API_SECRET) {
      console.warn("Webhook called with invalid secret");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { job_id, success, image_base64, execution_time, error } = body;

    if (!job_id) {
      return NextResponse.json(
        { error: "job_id is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the job
    const job = await Job.findById(job_id);
    if (!job) {
      console.error(`Job not found: ${job_id}`);
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Find the associated generation
    const generation = await Generation.findOne({ jobId: job._id });
    if (!generation) {
      console.error(`Generation not found for job: ${job_id}`);
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    if (success && image_base64) {
      // Upload image to GridFS
      const imageId = await uploadImage(
        image_base64,
        `generation_${generation._id}.png`,
        {
          userId: generation.userId,
          generationId: generation._id,
          jobId: job._id,
        }
      );

      // Update job as completed
      job.status = 'completed';
      job.output = {
        imageId: imageId,
      };
      job.execution = {
        ...job.execution,
        completedAt: new Date(),
        executionTime: execution_time,
      };
      await job.save();

      // Update generation
      generation.status = 'completed';
      generation.generatedImageId = imageId;
      generation.generationTime = execution_time;
      await generation.save();

      console.log(`✅ Generation ${generation._id} completed in ${execution_time}s`);

    } else {
      // Mark as failed
      job.status = 'failed';
      job.error = {
        message: error || 'Unknown error',
      };
      job.execution = {
        ...job.execution,
        completedAt: new Date(),
      };
      await job.save();

      generation.status = 'failed';
      await generation.save();

      console.error(`❌ Generation ${generation._id} failed: ${error}`);
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed",
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
