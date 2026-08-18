import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"

// Pharmacy: publish PAID procurement stock to website inventory (pharmacy_inventory)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.user_type !== "pharmacy") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pharmacyRows = await sql`
      SELECT id FROM pharmacy_profiles WHERE user_id = ${user.id}
    `
    if (!pharmacyRows.length) {
      return NextResponse.json({ error: "Pharmacy profile not found" }, { status: 404 })
    }
    const pharmacyId = (pharmacyRows[0] as any).id

    const { id } = await params
    const requestId = Number(id)
    if (Number.isNaN(requestId)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 })
    }

    const prRows = await sql`
      SELECT * FROM purchase_requests WHERE id = ${requestId}
    `
    if (!prRows.length) {
      return NextResponse.json({ error: "Purchase request not found" }, { status: 404 })
    }
    const pr = prRows[0] as any

    if (Number(pr.pharmacy_id) !== Number(pharmacyId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (pr.status !== "PAID") {
      return NextResponse.json(
        { error: "Only PAID requests can be published to store" },
        { status: 400 }
      )
    }

    if (pr.published_to_store_at) {
      return NextResponse.json(
        { error: "This request has already been published" },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const pricingMode = String((body as any).pricingMode || "mrp") as
      | "mrp"
      | "mrp_discount"
      | "custom"
    const discountPercentageRaw = Number((body as any).discountPercentage ?? 0)
    const discountPercentage = Number.isFinite(discountPercentageRaw)
      ? Math.max(0, Math.min(100, discountPercentageRaw))
      : 0
    const customSellingPriceRaw = Number((body as any).customSellingPrice)
    const customSellingPrice = Number.isFinite(customSellingPriceRaw) ? customSellingPriceRaw : null

    const items = await sql`
      SELECT *
      FROM purchase_items
      WHERE request_id = ${requestId}
    `

    for (const item of items as any[]) {
      const mrpRows = await sql`
        SELECT mrp FROM medicines WHERE id = ${item.medicine_id} LIMIT 1
      `
      const mrp = mrpRows.length ? Number((mrpRows[0] as any).mrp || 0) : 0

      let sellingPrice = Number(item.price || 0)
      let discountToStore = 0

      // Retail price strategy:
      // - mrp: publish at MRP (no discount)
      // - mrp_discount: publish at MRP with discount%
      // - custom: publish at custom selling_price (discount 0)
      if (pricingMode === "mrp") {
        sellingPrice = mrp
        discountToStore = 0
      } else if (pricingMode === "mrp_discount") {
        sellingPrice = mrp
        discountToStore = discountPercentage
      } else if (pricingMode === "custom" && customSellingPrice !== null) {
        sellingPrice = customSellingPrice
        discountToStore = 0
      }

      await sql`
        INSERT INTO pharmacy_inventory (
          pharmacy_id,
          medicine_id,
          stock_quantity,
          selling_price,
          discount_percentage,
          batch_number,
          expiry_date
        )
        VALUES (
          ${pharmacyId},
          ${item.medicine_id},
          ${item.quantity},
          ${sellingPrice},
          ${discountToStore},
          ${item.batch_number || null},
          ${item.expiry_date || null}
        )
        ON CONFLICT (pharmacy_id, medicine_id, batch_number)
        DO UPDATE SET
          stock_quantity = pharmacy_inventory.stock_quantity + EXCLUDED.stock_quantity,
          selling_price = EXCLUDED.selling_price,
          discount_percentage = EXCLUDED.discount_percentage,
          expiry_date = COALESCE(EXCLUDED.expiry_date, pharmacy_inventory.expiry_date),
          last_updated = CURRENT_TIMESTAMP
      `
    }

    await sql`
      UPDATE purchase_requests
      SET published_to_store_at = NOW(),
          updated_at = NOW()
      WHERE id = ${requestId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[PHARMACY PUBLISH] Error:", error)
    return NextResponse.json(
      { error: "Failed to publish stock", details: String(error) },
      { status: 500 }
    )
  }
}

