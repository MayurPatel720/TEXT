import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Job from "@/models/Job";
import Generation from "@/models/Generation";
import { ensureGpuAvailable, getWorkerUrl, isWorkerHealthy } from "@/lib/vastai";

export const dynamic = 'force-dynamic';

// GPU Worker configuration
const API_SECRET = process.env.API_SECRET || "your-secret-key";
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      image, 
      prompt, 
      style_strength, 
      structure_strength,
      num_variations,
      seed,
      aspect_ratio,
      output_format,
      quality,
      guidance 
    } = body;

    // Validate inputs
    if (!image || !prompt) {
      return NextResponse.json(
        { error: "Image and prompt are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Get user from database
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has enough credits
    const creditsNeeded = num_variations || 1;
    if (user.credits < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${creditsNeeded} credits but have ${user.credits}.` },
        { status: 403 }
      );
    }

    // 🚀 AUTO-START GPU IF NEEDED
    const gpuStatus = await ensureGpuAvailable();
    let workerUrl = gpuStatus.url;
    let gpuStarting = gpuStatus.status === "starting";

    if (gpuStatus.status === "unavailable") {
      console.warn("⚠️ GPU unavailable:", gpuStatus.message);
      // Continue anyway - jobs will queue and process when GPU is available
    }

    if (gpuStarting) {
      console.log("🚀 GPU is starting, jobs will be queued...");
    }

    const numImages = num_variations || 1;
    const variations = [];
    const savedGenerations = [];

    // Generate each variation
    for (let i = 0; i < numImages; i++) {
      try {
        // Create job in queue
        const job = await Job.create({
          userId: user._id,
          status: 'pending',
          priority: user.plan === 'enterprise' ? 100 : (user.plan === 'pro' ? 10 : 0),
          input: {
            imageData: image, // Base64 image
            prompt: prompt,
            settings: {
              seed: seed ? seed + i : undefined,
              guidance: guidance || (style_strength ? style_strength * 5 : 3.0),
              denoise: 0.98,
              steps: 25,
            },
          },
        });

        // Create pending generation record
        const generation = await Generation.create({
          userId: user._id,
          prompt,
          referenceImageUrl: image.substring(0, 100) + '...', // Truncated for storage
          status: 'processing',
          jobId: job._id,
          modelVersion: 'flux-kontext-dev',
          backend: 'self-hosted',
        });

        // Try to send to GPU worker if available
        if (workerUrl) {
          try {
            const workerResponse = await fetch(`${workerUrl}/generate/async`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Secret": API_SECRET,
              },
              body: JSON.stringify({
                job_id: job._id.toString(),
                image_base64: image.replace(/^data:image\/\w+;base64,/, ''),
                prompt: prompt,
                seed: seed ? seed + i : undefined,
                guidance: guidance || 3.0,
                denoise: 0.98,
                steps: 25,
                webhook_url: `${WEBHOOK_BASE_URL}/api/webhook/comfyui`,
              }),
            });

            if (!workerResponse.ok) {
              console.warn(`Worker returned ${workerResponse.status}, job queued for later`);
            } else {
              // Update job status
              job.status = 'processing';
              job.execution = { startedAt: new Date() };
              await job.save();
            }
          } catch (workerError) {
            // Worker not available, job stays in queue for later processing
            console.warn("GPU worker not available, job queued:", workerError);
          }
        }

        variations.push({
          id: generation._id.toString(),
          jobId: job._id.toString(),
          status: 'processing',
          seed: seed ? seed + i : null,
        });

        savedGenerations.push(generation._id);

      } catch (error) {
        console.error(`Error creating job ${i}:`, error);
      }
    }

    if (variations.length === 0) {
      return NextResponse.json(
        { error: "Failed to create any generation jobs. Please try again." },
        { status: 500 }
      );
    }

    // Deduct credits (1 credit per job created)
    await user.deductCredits(variations.length);

    console.log(`✅ Created ${variations.length} jobs for ${user.email}. Credits remaining: ${user.credits}`);

    return NextResponse.json({
      success: true,
      async: true, // Indicates async processing
      variations: variations,
      model: "flux-kontext-dev",
      backend: "self-hosted",
      creditsRemaining: user.credits,
      generationIds: savedGenerations,
      message: "Jobs queued for processing. Poll /api/generate/[id] for status.",
    });

  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
