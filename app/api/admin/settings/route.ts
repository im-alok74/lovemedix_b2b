import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin"])

    const settings = await sql`
      SELECT key, value, type, description, updated_at
      FROM platform_settings
      ORDER BY key ASC
    `

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("[admin/settings] GET error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(["admin"])

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 })
    }

    const updatedSettings = []
    for (const [key, value] of Object.entries(settings)) {
      const result = await sql`
        INSERT INTO platform_settings (key, value, updated_at)
        VALUES (${key}, ${String(value)}, NOW())
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `
      updatedSettings.push(result[0])
    }

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: "Settings updated successfully",
    })
  } catch (error) {
    console.error("[admin/settings] PATCH error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
