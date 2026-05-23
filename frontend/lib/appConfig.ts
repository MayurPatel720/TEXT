import connectDB from "@/lib/mongodb"

export async function getActiveBackend(): Promise<"cloudflare" | "fal-ai"> {
  try {
    const AppConfig = (await import("@/models/AppConfig")).default
    await connectDB()
    const config = await AppConfig.findOne({ key: "activeBackend" }).lean()
    const value = config?.value as string | undefined
    if (value === "cloudflare") return "cloudflare"
    return "fal-ai"
  } catch (err) {
    console.error("Failed to read activeBackend config, defaulting to fal-ai:", err)
    return "fal-ai"
  }
}
