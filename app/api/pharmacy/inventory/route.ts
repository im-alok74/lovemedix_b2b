import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.user_type !== "pharmacy") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pharmacyResult = await sql`
      SELECT id, verification_status
      FROM pharmacy_profiles
      WHERE user_id = ${user.id}
      LIMIT 1
    ` as any[]

    if (pharmacyResult.length === 0) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 })
    }

    if (pharmacyResult[0].verification_status !== "verified") {
      return NextResponse.json({ error: "Pharmacy not verified yet" }, { status: 403 })
    }

    const inventory = await sql`
      SELECT
        pi.id,
        pi.medicine_id,
        pi.stock_quantity,
        pi.selling_price,
        pi.discount_percentage,
        pi.batch_number,
        pi.expiry_date,
        pi.last_updated,
        m.name AS medicine_name,
        m.generic_name,
        m.manufacturer,
        m.image_url,
        m.mrp,
        COALESCE(
          json_agg(mi.image_url) FILTER (WHERE mi.image_url IS NOT NULL),
          '[]'
        ) AS images
      FROM pharmacy_inventory pi
      JOIN medicines m ON m.id = pi.medicine_id
      LEFT JOIN medicine_images mi ON mi.medicine_id = m.id
      WHERE pi.pharmacy_id = ${pharmacyResult[0].id}
      GROUP BY pi.id, m.id
      ORDER BY pi.last_updated DESC
    ` as any[]

    return NextResponse.json({ inventory })
  } catch (error: any) {
    console.error("[PHARMACY INVENTORY] Error fetching inventory:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory", details: String(error) },
      { status: 500 }
    )
  }
}