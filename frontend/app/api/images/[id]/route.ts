import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { downloadImage, getImageInfo } from "@/lib/gridfs";

export const dynamic = 'force-dynamic';

/**
 * GET /api/images/[id]
 * Serve images from GridFS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();

    // Get image info
    const info = await getImageInfo(id);
    if (!info) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Download image data
    const imageData = await downloadImage(id);

    // Return image with proper headers
    return new NextResponse(new Uint8Array(imageData), {
      headers: {
        "Content-Type": info.metadata?.contentType || "image/png",
        "Content-Length": imageData.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${info.filename}"`,
      },
    });

  } catch (error) {
    console.error("Error serving image:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}
