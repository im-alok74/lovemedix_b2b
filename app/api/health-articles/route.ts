import { NextRequest, NextResponse } from "next/server"
import { getHealthArticlesWithMeta } from "@/lib/health-articles"

export async function GET(request: NextRequest) {
  try {
    const topic = request.nextUrl.searchParams.get("topic") || ""
    const { articles, usedFallback, modelUsed } = await getHealthArticlesWithMeta(topic)

    return NextResponse.json({
      source: process.env.GEMINI_API_KEY ? "gemini-or-fallback" : "fallback",
      modelUsed,
      usedFallback,
      topic,
      articles,
    })
  } catch (error) {
    console.error("[HEALTH ARTICLES] Error:", error)
    return NextResponse.json(
      { error: "Failed to load health articles" },
      { status: 500 }
    )
  }
}
