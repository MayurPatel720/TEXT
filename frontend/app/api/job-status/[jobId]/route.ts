import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import RentalJob from '@/models/RentalJob';
import Job from '@/models/Job';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { jobId } = params;

    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    await connectDB();

    // First, check if it's a rental job
    const rentalJob = await RentalJob.findById(jobId);
    if (rentalJob) {
      return NextResponse.json(formatRentalJobStatus(rentalJob));
    }

    // Otherwise, check if it's a generation job
    const generationJob = await Job.findById(jobId);
    if (generationJob) {
      return NextResponse.json(formatGenerationJobStatus(generationJob));
    }

    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get job status' },
      { status: 500 }
    );
  }
}

function formatRentalJobStatus(job: any) {
  const totalSteps = job.steps.length;
  const completedSteps = job.steps.filter((s: any) => s.status === 'done').length;
  const currentStep = job.steps.find((s: any) => s.status === 'running');
  const progressPercent = (completedSteps / totalSteps) * 100;

  let message = 'Initializing...';
  if (job.status === 'failed') {
    message = `❌ Setup failed: ${job.error?.message || 'Unknown error'}`;
  } else if (job.status === 'ready') {
    message = '✅ GPU Ready! Your instance is set up and running.';
  } else if (currentStep) {
    message = currentStep.message || currentStep.name;
  }

  return {
    jobId: job._id.toString(),
    type: 'rental',
    status: job.status === 'ready' ? 'completed' : job.status === 'failed' ? 'failed' : 'processing',
    message,
    progress: progressPercent,
    currentStep: job.currentStep,
    totalSteps,
    steps: job.steps.map((s: any) => ({
      name: s.name,
      status: s.status,
      message: s.message,
    })),
    instanceDetails: job.status === 'ready' ? job.instanceDetails : undefined,
    vastInstanceId: job.vastInstanceId,
  };
}

function formatGenerationJobStatus(job: any) {
  let message = 'Processing...';
  let progress = 0;

  switch (job.status) {
    case 'pending':
      message = 'Queued - waiting for GPU...';
      progress = 10;
      break;
    case 'processing':
      message = 'Generating your design...';
      progress = 50;
      break;
    case 'completed':
      message = '✅ Generation complete!';
      progress = 100;
      break;
    case 'failed':
      message = `❌ Failed: ${job.error?.message || 'Unknown error'}`;
      progress = 0;
      break;
  }

  return {
    jobId: job._id.toString(),
    type: 'generation',
    status: job.status,
    message,
    progress,
    output: job.output,
    executionTime: job.execution?.executionTime,
  };
}
