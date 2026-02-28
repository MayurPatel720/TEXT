import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { jobId } = params;

    // TODO: Implement actual job status checking
    // For now, return a mock status
    
    // Simulate progress
    const progress = [
      'Initializing...',
      'Renting GPU instance...',
      'Waiting for instance to start...',
      'Connecting via SSH...',
      'Installing ComfyUI...',
      'Downloading models...',
      'Configuring workflows...',
      'Starting worker...',
      'Verifying setup...',
      'GPU Ready!',
    ];

    const randomIndex = Math.floor(Math.random() * progress.length);

    return NextResponse.json({
      jobId,
      status: 'processing',
      message: progress[randomIndex],
      progress: (randomIndex / progress.length) * 100,
    });
  } catch (error: any) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get job status' },
      { status: 500 }
    );
  }
}
