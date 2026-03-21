import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import RentalJob from '@/models/RentalJob';
import {
  rentGpuInstance,
  getInstanceStatusWithKey,
  generateOnStartScript,
} from '@/lib/vastai-rental';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for rental

const API_SECRET = process.env.API_SECRET || 'your-secret-key';
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { vastApiKey, offerId } = await req.json();

    if (!vastApiKey || !offerId) {
      return NextResponse.json(
        { error: 'Missing required fields: vastApiKey and offerId' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create rental job record with progress steps
    const rentalJob = await RentalJob.create({
      userId: user._id,
      vastOfferId: offerId,
      status: 'pending',
      currentStep: 0,
      steps: [
        { name: 'Renting GPU instance', status: 'pending', message: 'Contacting Vast.ai...' },
        { name: 'Waiting for instance to start', status: 'pending', message: 'Instance booting...' },
        { name: 'Installing ComfyUI', status: 'pending', message: 'Setting up AI engine...' },
        { name: 'Downloading FLUX models', status: 'pending', message: 'Downloading ~8GB models...' },
        { name: 'Starting worker API', status: 'pending', message: 'Configuring worker...' },
        { name: 'Verifying setup', status: 'pending', message: 'Running health checks...' },
      ],
    });

    // Step 1: Rent the GPU
    rentalJob.status = 'renting';
    rentalJob.steps[0].status = 'running';
    rentalJob.currentStep = 0;
    await rentalJob.save();

    const onStartScript = generateOnStartScript(WEBHOOK_BASE_URL, API_SECRET);

    const rentResult = await rentGpuInstance(vastApiKey, offerId, onStartScript);

    if (!rentResult.success || !rentResult.instanceId) {
      rentalJob.status = 'failed';
      rentalJob.steps[0].status = 'failed';
      rentalJob.error = {
        message: rentResult.error || 'Failed to rent GPU',
        step: 'renting',
      };
      await rentalJob.save();

      return NextResponse.json({
        success: false,
        jobId: rentalJob._id.toString(),
        error: rentResult.error || 'Failed to rent GPU from Vast.ai',
      }, { status: 500 });
    }

    // Rental succeeded - update job
    rentalJob.vastInstanceId = rentResult.instanceId;
    rentalJob.steps[0].status = 'done';
    rentalJob.steps[0].completedAt = new Date();
    rentalJob.status = 'waiting_start';
    rentalJob.steps[1].status = 'running';
    rentalJob.currentStep = 1;
    await rentalJob.save();

    // Start background polling for instance readiness
    // (The on-start script handles ComfyUI + worker setup automatically)
    pollInstanceReady(
      rentalJob._id.toString(),
      vastApiKey,
      rentResult.instanceId
    ).catch(console.error);

    return NextResponse.json({
      success: true,
      jobId: rentalJob._id.toString(),
      instanceId: rentResult.instanceId,
      message: 'GPU rented! Setting up ComfyUI + worker automatically...',
    });
  } catch (error: any) {
    console.error('GPU rental error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to rent GPU' },
      { status: 500 }
    );
  }
}

/**
 * Background polling to check when the instance is ready
 * Updates the RentalJob record as each step completes
 */
async function pollInstanceReady(
  rentalJobId: string,
  vastApiKey: string,
  instanceId: number,
) {
  const MAX_WAIT = 10 * 60 * 1000; // 10 minutes max
  const POLL_INTERVAL = 15 * 1000; // Check every 15 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

    try {
      await connectDB();
      const rentalJob = await RentalJob.findById(rentalJobId);
      if (!rentalJob || rentalJob.status === 'failed' || rentalJob.status === 'ready') {
        return; // Already done or cancelled
      }

      const instanceStatus = await getInstanceStatusWithKey(vastApiKey, instanceId);

      if (!instanceStatus) {
        continue; // Can't reach Vast.ai, try again
      }

      // Check if instance is running
      if (instanceStatus.status === 'running' && instanceStatus.publicIp) {
        // Instance is running - update steps
        if (rentalJob.currentStep < 2) {
          rentalJob.steps[1].status = 'done';
          rentalJob.steps[1].completedAt = new Date();
          rentalJob.status = 'installing';
          rentalJob.steps[2].status = 'running';
          rentalJob.currentStep = 2;

          // Store instance details
          const workerPort = instanceStatus.ports['8000/tcp']?.[0]?.HostPort || 8000;
          rentalJob.instanceDetails = {
            publicIp: instanceStatus.publicIp,
            sshPort: instanceStatus.sshPort || 22,
            workerPort: workerPort,
            workerUrl: `http://${instanceStatus.publicIp}:${workerPort}`,
          };
          await rentalJob.save();
        }

        // Check if worker is responding (means setup is complete)
        const workerPort = instanceStatus.ports['8000/tcp']?.[0]?.HostPort || 8000;
        const workerUrl = `http://${instanceStatus.publicIp}:${workerPort}`;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const healthResponse = await fetch(`${workerUrl}/health`, {
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (healthResponse.ok) {
            const healthData = await healthResponse.json();

            if (healthData.status === 'healthy') {
              // Worker is ready! Mark all remaining steps as done
              for (let i = rentalJob.currentStep; i < rentalJob.steps.length; i++) {
                rentalJob.steps[i].status = 'done';
                rentalJob.steps[i].completedAt = new Date();
              }
              rentalJob.status = 'ready';
              rentalJob.currentStep = rentalJob.steps.length;
              rentalJob.instanceDetails.workerUrl = workerUrl;
              await rentalJob.save();

              console.log(`✅ Rental job ${rentalJobId} ready! Worker: ${workerUrl}`);
              return; // Done!
            }
          }
        } catch {
          // Worker not ready yet, continue polling
        }

        // If we've been running for a while, advance the progress steps based on time
        const elapsed = Date.now() - startTime;
        if (elapsed > 60000 && rentalJob.currentStep === 2) {
          // After 1 min, assume ComfyUI install started
          rentalJob.steps[2].status = 'done';
          rentalJob.steps[2].completedAt = new Date();
          rentalJob.steps[3].status = 'running';
          rentalJob.currentStep = 3;
          rentalJob.status = 'installing';
          await rentalJob.save();
        } else if (elapsed > 180000 && rentalJob.currentStep === 3) {
          // After 3 min, assume models downloading
          rentalJob.steps[3].status = 'done';
          rentalJob.steps[3].completedAt = new Date();
          rentalJob.steps[4].status = 'running';
          rentalJob.currentStep = 4;
          rentalJob.status = 'configuring';
          await rentalJob.save();
        } else if (elapsed > 300000 && rentalJob.currentStep === 4) {
          // After 5 min, starting worker
          rentalJob.steps[4].status = 'done';
          rentalJob.steps[4].completedAt = new Date();
          rentalJob.steps[5].status = 'running';
          rentalJob.currentStep = 5;
          rentalJob.status = 'starting_worker';
          await rentalJob.save();
        }
      }
    } catch (error) {
      console.error('Poll error:', error);
    }
  }

  // Timeout - mark as failed
  try {
    await connectDB();
    const rentalJob = await RentalJob.findById(rentalJobId);
    if (rentalJob && rentalJob.status !== 'ready') {
      rentalJob.status = 'failed';
      rentalJob.error = {
        message: 'Setup timed out after 10 minutes. The instance may still be setting up - check Vast.ai console.',
        step: 'timeout',
      };
      await rentalJob.save();
    }
  } catch (e) {
    console.error('Timeout update error:', e);
  }
}
