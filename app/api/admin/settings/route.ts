import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin"])

    const settings = await sql`
      SELECT setting_key, setting_value, description 
      FROM platform_settings
      ORDER BY setting_key
    `

    return NextResponse.json({ settings })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin"])

    const body = await request.json()
    const { setting_key, setting_value } = body

    if (!setting_key || setting_value === undefined) {
      return NextResponse.json(
        { error: "Missing setting_key or setting_value" },
        { status: 400 }
      )
    }

    const result = await sql`
      UPDATE platform_settings 
      SET setting_value = ${setting_value}, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = ${setting_key}
      RETURNING *
    `

    if (result.length === 0) {
      // Insert if not exists
      const insertResult = await sql`
        INSERT INTO platform_settings (setting_key, setting_value)
        VALUES (${setting_key}, ${setting_value})
        RETURNING *
      `
      return NextResponse.json({ setting: insertResult[0] })
    }

    return NextResponse.json({ setting: result[0] })
  } catch (error: any) {
    console.error("[admin-settings] Error:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
