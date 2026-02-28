// Public API to fetch generation data for sharing (NO AUTH REQUIRED)
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Generation from "@/models/Generation";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // For our UI mocking tests
        if (id.startsWith("mock-")) {
            const MOCK_IMAGE_URL = "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2787&auto=format&fit=crop";
            return NextResponse.json({
                success: true,
                generation: {
                    _id: id,
                    url: MOCK_IMAGE_URL,
                    seed: id === "mock-1" ? 12345 : 67890,
                    status: "completed",
                }
            });
        }

        await connectDB();

        // Fetch the generation but ONLY return safe public data (no user info)
        const generation = await Generation.findById(id).select('generatedImageUrl status seed createdAt modelVersion');

        if (!generation || generation.status !== 'completed') {
            return NextResponse.json(
                { error: "Image not found or not ready yet" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            generation: {
                _id: generation._id,
                url: generation.generatedImageUrl,
                seed: generation.seed,
                status: generation.status,
            }
        });
    } catch (error) {
        console.error("Error fetching shared image:", error);
        return NextResponse.json(
            { error: "Failed to load shared image" },
            { status: 500 }
        );
    }
}
