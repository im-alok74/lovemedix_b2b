import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"

// List purchase requests for current pharmacy
export async function GET(request: NextRequest) {
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

    const requests = await sql`
      SELECT
        pr.*,
        dp.company_name AS distributor_name,
        inv.invoice_number,
        inv.payment_status AS invoice_payment_status,
        COUNT(pi.id) AS item_count,
        COALESCE(SUM(pi.line_total), 0)::decimal(12,2) AS items_total,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'medicine_id', pi.medicine_id,
              'medicine_name', m.name,
              'batch_number', pi.batch_number,
              'expiry_date', pi.expiry_date,
              'quantity', pi.quantity,
              'price', pi.price,
              'line_total', pi.line_total
            )
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM purchase_requests pr
      LEFT JOIN distributor_profiles dp ON pr.distributor_id = dp.id
      LEFT JOIN purchase_items pi ON pr.id = pi.request_id
      LEFT JOIN medicines m ON pi.medicine_id = m.id
      LEFT JOIN purchase_invoices inv ON inv.request_id = pr.id
      WHERE pr.pharmacy_id = ${pharmacyId}
      GROUP BY pr.id, dp.company_name, inv.invoice_number, inv.payment_status
      ORDER BY pr.created_at DESC
    `

    return NextResponse.json({ requests })
  } catch (error: any) {
    console.error("[PROCUREMENT REQUESTS] List error:", error)
    return NextResponse.json(
      { error: "Failed to load purchase requests", details: String(error) },
      { status: 500 }
    )
  }
}

// Create a new purchase request and atomically reserve stock
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { items, notes } = body as {
      items: { distributorMedicineId: number; quantity: number }[]
      notes?: string
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    // Reserve stock per item using an atomic UPDATE that prevents overselling
    let totalAmount = 0
    let distributorId: number | null = null
    const reservedItems: {
      distributorMedicineId: number
      quantity: number
      price: number
      lineTotal: number
      snapshot: any
    }[] = []

    for (const item of items) {
      const qty = Number(item.quantity)
      if (!item.distributorMedicineId || !qty || qty <= 0) {
        return NextResponse.json({ error: "Invalid item payload" }, { status: 400 })
      }

      const rows = await sql`
        UPDATE distributor_medicines
        SET reserved_quantity = reserved_quantity + ${qty}
        WHERE id = ${item.distributorMedicineId}
          AND (quantity - reserved_quantity) >= ${qty}
        RETURNING *,
          (quantity - reserved_quantity) AS remaining_available
      `

      if (!rows.length) {
        return NextResponse.json(
          { error: "Insufficient stock for one or more items" },
          { status: 409 }
        )
      }

      const dm = rows[0] as any
      if (distributorId === null) {
        distributorId = Number(dm.distributor_id)
      } else if (Number(dm.distributor_id) !== distributorId) {
        // Release the reservation we just made for this item before returning
        await sql`
          UPDATE distributor_medicines
          SET reserved_quantity = GREATEST(reserved_quantity - ${qty}, 0)
          WHERE id = ${item.distributorMedicineId}
        `
        return NextResponse.json(
          { error: "A single purchase request must contain items from only one distributor" },
          { status: 400 }
        )
      }
      const price = Number(dm.unit_price)
      const lineTotal = price * qty
      totalAmount += lineTotal

      reservedItems.push({
        distributorMedicineId: dm.id,
        quantity: qty,
        price,
        lineTotal,
        snapshot: dm,
      })
    }

    // Create purchase_request
    const expiresAtRows = await sql`SELECT NOW() + INTERVAL '30 minutes' AS expires_at`
    const expiresAt = (expiresAtRows[0] as any).expires_at

    const prRows = await sql`
      INSERT INTO purchase_requests (pharmacy_id, distributor_id, status, total_amount, notes, expires_at)
      VALUES (${pharmacyId}, ${distributorId}, 'PENDING', ${totalAmount}, ${notes || null}, ${expiresAt})
      RETURNING *
    `
    const pr = prRows[0] as any

    // Insert purchase_items with snapshot data
    for (const item of reservedItems) {
      const dm = item.snapshot
      await sql`
        INSERT INTO purchase_items (
          request_id,
          distributor_medicine_id,
          quantity,
          price,
          line_total,
          medicine_id,
          pharmacy_id,
          distributor_id,
          batch_number,
          expiry_date
        )
        VALUES (
          ${pr.id},
          ${item.distributorMedicineId},
          ${item.quantity},
          ${item.price},
          ${item.lineTotal},
          ${dm.medicine_id},
          ${pharmacyId},
          ${dm.distributor_id},
          ${dm.batch_number},
          ${dm.expiry_date}
        )
      `
    }

    return NextResponse.json({ success: true, request: pr })
  } catch (error: any) {
    console.error("[PROCUREMENT REQUESTS] Create error:", error)
    return NextResponse.json(
      { error: "Failed to create purchase request", details: String(error) },
      { status: 500 }
    )
  }
}

