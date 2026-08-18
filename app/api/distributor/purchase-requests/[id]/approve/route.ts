import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"

// Distributor: approve purchase request (either admin OR distributor approval is enough)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.user_type !== "distributor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const distributorRows = await sql`
      SELECT id FROM distributor_profiles WHERE user_id = ${user.id}
    `
    if (!distributorRows.length) {
      return NextResponse.json({ error: "Distributor profile not found" }, { status: 404 })
    }
    const distributorId = (distributorRows[0] as any).id

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

    if (Number(pr.distributor_id) !== Number(distributorId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Expiry handling
    if (pr.status === "PENDING" && pr.expires_at && new Date(pr.expires_at) < new Date()) {
      const items = await sql`
        SELECT distributor_medicine_id, quantity
        FROM purchase_items
        WHERE request_id = ${requestId}
      `
      for (const row of items as any[]) {
        await sql`
          UPDATE distributor_medicines
          SET reserved_quantity = GREATEST(reserved_quantity - ${row.quantity}, 0)
          WHERE id = ${row.distributor_medicine_id}
        `
      }
      await sql`
        UPDATE purchase_requests
        SET status = 'EXPIRED', updated_at = NOW()
        WHERE id = ${requestId}
      `
      return NextResponse.json({ error: "Request expired and lock released" }, { status: 410 })
    }

    if (pr.status !== "PENDING") {
      return NextResponse.json({ error: "Only PENDING requests can be approved" }, { status: 400 })
    }

    const items = await sql`
      SELECT * FROM purchase_items WHERE request_id = ${requestId}
    `
    if (!items.length) {
      return NextResponse.json({ error: "Request has no items" }, { status: 400 })
    }

    // Decrement distributor stock (mark as sold)
    for (const item of items as any[]) {
      const dmRows = await sql`
        SELECT * FROM distributor_medicines WHERE id = ${item.distributor_medicine_id}
      `
      if (!dmRows.length) {
        return NextResponse.json({ error: "Distributor stock not found for an item" }, { status: 409 })
      }
      const dm = dmRows[0] as any
      if (dm.reserved_quantity < item.quantity || dm.quantity < item.quantity) {
        return NextResponse.json({ error: "Insufficient reserved stock for an item" }, { status: 409 })
      }
      await sql`
        UPDATE distributor_medicines
        SET quantity = quantity - ${item.quantity},
            reserved_quantity = reserved_quantity - ${item.quantity},
            amount = (quantity - ${item.quantity}) * unit_price
        WHERE id = ${item.distributor_medicine_id}
      `
    }

    await sql`
      UPDATE purchase_requests
      SET status = 'APPROVED',
          approved_by = 'distributor',
          updated_at = NOW()
      WHERE id = ${requestId}
    `

    const invoiceNumberRows = await sql`
      SELECT CONCAT('PR-', ${requestId}::text, '-', TO_CHAR(NOW(), 'YYYYMMDDHH24MISS')) AS invoice_number
    `
    const invoiceNumber = (invoiceNumberRows[0] as any).invoice_number

    const invoiceRows = await sql`
      INSERT INTO purchase_invoices (request_id, invoice_number, payment_status)
      VALUES (${requestId}, ${invoiceNumber}, 'APPROVED_UNPAID')
      ON CONFLICT (request_id) DO UPDATE SET
        invoice_number = EXCLUDED.invoice_number,
        updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({ success: true, status: "APPROVED", invoice: invoiceRows[0] })
  } catch (error: any) {
    console.error("[DISTRIBUTOR PURCHASE REQUESTS] Approve error:", error)
    return NextResponse.json(
      { error: "Failed to approve purchase request", details: String(error) },
      { status: 500 }
    )
  }
}

