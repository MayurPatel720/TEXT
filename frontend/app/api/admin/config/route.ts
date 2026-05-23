import { NextResponse } from "next/server"
import { getServerSession, type Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import AppConfig from "@/models/AppConfig"

export const dynamic = "force-dynamic"

const VALID_BACKENDS = ["cloudflare", "fal-ai"] as const

async function verifyAdmin(session: Session | null) {
  const email = session?.user?.email
  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 as const }
  }
  await connectDB()
  const adminUser = await User.findOne({ email: session.user.email })
  if (!adminUser || adminUser.role !== "admin") {
    return { error: "Admin access required", status: 403 as const }
  }
  return null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const authError = await verifyAdmin(session)
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const config = await AppConfig.findOne({ key: "activeBackend" }).lean()

    return NextResponse.json({
      activeBackend: (config?.value as string) || "fal-ai",
    })
  } catch (error) {
    console.error("Config GET error:", error)
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const authError = await verifyAdmin(session)
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const { activeBackend } = (await request.json()) as { activeBackend?: string }

    if (!activeBackend || !(VALID_BACKENDS as readonly string[]).includes(activeBackend)) {
      return NextResponse.json(
        { error: `Invalid backend. Must be one of: ${VALID_BACKENDS.join(", ")}` },
        { status: 400 }
      )
    }

    if (activeBackend === "cloudflare") {
      if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
        return NextResponse.json(
          {
            error:
              "CLOUDFLARE_ACCOUNT_ID is not set. Add it to your environment variables before switching to Cloudflare AI.",
          },
          { status: 400 }
        )
      }
      if (!process.env.CLOUDFLARE_API_TOKEN) {
        return NextResponse.json(
          {
            error:
              "CLOUDFLARE_API_TOKEN is not set. Add it to your environment variables before switching to Cloudflare AI.",
          },
          { status: 400 }
        )
      }
    }

    const adminEmail = session!.user!.email!

    await AppConfig.findOneAndUpdate(
      { key: "activeBackend" },
      {
        value: activeBackend,
        updatedBy: adminEmail,
        updatedAt: new Date(),
        description: `Active image generation backend. Toggled by ${adminEmail}`,
      },
      { upsert: true }
    )

    console.log(`🔀 Backend switched to ${activeBackend} by ${adminEmail}`)

    return NextResponse.json({
      success: true,
      activeBackend,
      message: `Generation backend switched to ${activeBackend === "cloudflare" ? "Cloudflare AI (Free)" : "fal.ai (Paid)"}`,
    })
  } catch (error) {
    console.error("Config PATCH error:", error)
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 })
  }
}
