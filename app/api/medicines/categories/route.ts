import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(_request: NextRequest) {
  try {
    const rows = await sql`
      SELECT DISTINCT m.category
      FROM pharmacy_inventory pi
      JOIN pharmacy_profiles pp ON pp.id = pi.pharmacy_id AND pp.verification_status = 'verified'
      JOIN medicines m ON m.id = pi.medicine_id
      WHERE m.status = 'active'
        AND m.category IS NOT NULL
        AND m.category <> ''
        AND pi.stock_quantity > 0
        AND (pi.expiry_date IS NULL OR pi.expiry_date >= CURRENT_DATE)
      ORDER BY m.category
    `

    const categories = (rows as any[]).map((r) => r.category)
    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error("[MEDICINE CATEGORIES] Error:", error)
    return NextResponse.json(
      { error: "Failed to load categories", details: String(error) },
      { status: 500 }
    )
  }
}

