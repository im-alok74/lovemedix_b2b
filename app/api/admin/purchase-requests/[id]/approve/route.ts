import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { sql } from "@/lib/db"

// Admin: approve a purchase request, move stock and create invoice
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"])
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

    // Handle expired locks
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

      return NextResponse.json(
        { error: "Request expired and lock released" },
        { status: 410 }
      )
    }

    if (pr.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only PENDING requests can be approved" },
        { status: 400 }
      )
    }

    const items = await sql`
      SELECT * FROM purchase_items WHERE request_id = ${requestId}
    `
    if (!items.length) {
      return NextResponse.json(
        { error: "Request has no items" },
        { status: 400 }
      )
    }

    // Mark stock as sold (decrement distributor stock) and create invoice.
    // Publishing to customers is done later by the pharmacy after payment is collected.
    for (const item of items as any[]) {
      const dmRows = await sql`
        SELECT * FROM distributor_medicines WHERE id = ${item.distributor_medicine_id}
      `
      if (!dmRows.length) {
        return NextResponse.json(
          { error: "Distributor stock not found for an item" },
          { status: 409 }
        )
      }
      const dm = dmRows[0] as any

      // Ensure reserved stock is still sufficient
      if (dm.reserved_quantity < item.quantity || dm.quantity < item.quantity) {
        return NextResponse.json(
          { error: "Insufficient reserved stock for an item" },
          { status: 409 }
        )
      }

      // Decrement distributor quantities
      await sql`
        UPDATE distributor_medicines
        SET quantity = quantity - ${item.quantity},
            reserved_quantity = reserved_quantity - ${item.quantity},
            amount = (quantity - ${item.quantity}) * unit_price
        WHERE id = ${item.distributor_medicine_id}
      `
    }

    // Mark request as approved
    await sql`
      UPDATE purchase_requests
      SET status = 'APPROVED',
          approved_by = 'admin',
          updated_at = NOW()
      WHERE id = ${requestId}
    `

    // Generate a simple invoice record
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

    return NextResponse.json({
      success: true,
      status: "APPROVED",
      invoice: invoiceRows[0],
    })
  } catch (error: any) {
    console.error("[ADMIN PURCHASE REQUESTS] Approve error:", error)
    return NextResponse.json(
      { error: "Failed to approve purchase request", details: String(error) },
      { status: 500 }
    )
  }
}

