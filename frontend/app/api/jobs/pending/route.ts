import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { error: "Job queue disabled - using fal.ai direct inference" },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Job queue disabled - using fal.ai direct inference" },
    { status: 410 }
  );
}
