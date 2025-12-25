import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Job from "@/models/Job";

export const dynamic = 'force-dynamic';

// Secret for API authentication
const API_SECRET = process.env.API_SECRET || "your-secret-key";

/**
 * GET /api/jobs/pending
 * Get pending jobs for GPU manager
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API secret
    const secret = request.headers.get("X-API-Secret");
    if (secret !== API_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get pending jobs (sorted by priority and creation time)
    const jobs = await Job.find({ status: 'pending' })
      .sort({ priority: -1, createdAt: 1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      count: jobs.length,
      jobs: jobs,
    });

  } catch (error) {
    console.error("Error fetching pending jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending jobs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs/pending
 * Update job status (mark as processing)
 */
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("X-API-Secret");
    if (secret !== API_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { job_id, status } = await request.json();

    if (!job_id || !status) {
      return NextResponse.json(
        { error: "job_id and status required" },
        { status: 400 }
      );
    }

    await connectDB();

    const job = await Job.findByIdAndUpdate(
      job_id,
      { 
        status,
        'execution.startedAt': status === 'processing' ? new Date() : undefined,
      },
      { new: true }
    );

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: job,
    });

  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}
