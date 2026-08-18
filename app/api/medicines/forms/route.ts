import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(_request: NextRequest) {
  try {
    const rows = await sql`
      SELECT DISTINCT m.form
      FROM pharmacy_inventory pi
      JOIN pharmacy_profiles pp ON pp.id = pi.pharmacy_id AND pp.verification_status = 'verified'
      JOIN medicines m ON m.id = pi.medicine_id
      WHERE m.status = 'active'
        AND m.form IS NOT NULL
        AND m.form <> ''
        AND pi.stock_quantity > 0
        AND (pi.expiry_date IS NULL OR pi.expiry_date >= CURRENT_DATE)
      ORDER BY m.form
    `

    const forms = (rows as any[]).map((r) => r.form)
    return NextResponse.json({ forms })
  } catch (error: any) {
    console.error("[MEDICINE FORMS] Error:", error)
    return NextResponse.json(
      { error: "Failed to load forms", details: String(error) },
      { status: 500 }
    )
  }
}

