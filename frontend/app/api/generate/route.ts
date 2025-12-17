import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Generation from "@/models/Generation";

// Using Flux Kontext Fast model for textile design generation
// Model: prunaai/flux-kontext-fast
// Cost: ~$0.003 per image
// Speed: ~2 seconds per image

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
    const { image, prompt, style_strength, num_variations } = body;

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

    const apiToken = process.env.REPLICATE_API_TOKEN;

    // If no API token, return demo response
    if (!apiToken) {
      console.log("No REPLICATE_API_TOKEN found - returning demo response");
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockVariations = Array.from({ length: num_variations || 4 }, (_, i) => ({
        id: `demo-${i}-${Date.now()}`,
        url: image,
        seed: Math.floor(Math.random() * 1000000)
      }));

      // Save mock generation to database
      await Generation.create({
        userId: user._id,
        prompt,
        referenceImageUrl: image,
        generatedImageUrl: mockVariations[0].url,
        status: 'completed',
        modelVersion: 'demo-mode',
      });

      // Deduct credits
      await user.deductCredits(1);

      return NextResponse.json({
        success: true,
        demo: true,
        message: "Demo mode - Add REPLICATE_API_TOKEN to .env.local for real generation",
        variations: mockVariations,
        creditsRemaining: user.credits,
      });
    }

    // Generate multiple variations
    const variations = [];
    const numImages = num_variations || 4;
    const savedGenerations = [];

    for (let i = 0; i < numImages; i++) {
      try {
        // Call Replicate API for Flux Kontext
        const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json",
            "Prefer": "wait" // Wait for result
          },
          body: JSON.stringify({
            version: "prunaai/flux-kontext-fast",
            input: {
              prompt: prompt,
              guidance: style_strength ? style_strength * 5 : 2.5, // Convert 0-1 to 0-5
              speed_mode: "Real Time",
              img_cond_path: image
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }));
          console.error("Replicate API error:", errorData);
          
          // If it's the first variation and it fails, return error
          if (i === 0) {
            return NextResponse.json(
              { error: errorData.detail || errorData.title || "Replicate API Error" },
              { status: response.status }
            );
          }
          continue; // Skip this variation
        }

        const prediction = await response.json();
        
        // If we need to poll for result
        let result = prediction;
        if (result.status === "starting" || result.status === "processing") {
          // Poll until complete
          while (result.status !== "succeeded" && result.status !== "failed") {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const statusResponse = await fetch(
              `https://api.replicate.com/v1/predictions/${prediction.id}`,
              {
                headers: {
                  "Authorization": `Bearer ${apiToken}`,
                },
              }
            );
            result = await statusResponse.json();
          }
        }

        if (result.status === "succeeded" && result.output) {
          const imageUrl = typeof result.output === 'string' ? result.output : result.output[0] || result.output;
          
          variations.push({
            id: `gen-${i}-${Date.now()}`,
            url: imageUrl,
            seed: i
          });

          // Save generation to database
          const generation = await Generation.create({
            userId: user._id,
            prompt,
            referenceImageUrl: image,
            generatedImageUrl: imageUrl,
            replicateId: prediction.id,
            status: 'completed',
            modelVersion: 'flux-kontext-fast',
            generationTime: result.metrics?.predict_time,
          });

          savedGenerations.push(generation._id);
        }
      } catch (error) {
        console.error(`Error generating variation ${i}:`, error);
      }
    }

    if (variations.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate any variations. Please try again." },
        { status: 500 }
      );
    }

    // Deduct credits (1 credit per successful generation)
    await user.deductCredits(variations.length);

    console.log(`✅ Generated ${variations.length} images for ${user.email}. Credits remaining: ${user.credits}`);

    return NextResponse.json({
      success: true,
      variations: variations,
      model: "prunaai/flux-kontext-fast",
      creditsRemaining: user.credits,
      generationIds: savedGenerations,
    });

  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
