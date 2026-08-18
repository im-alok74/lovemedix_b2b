import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { sql } from "@/lib/db"

// Admin: reject a purchase request and release reserved stock
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

    if (pr.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only PENDING requests can be rejected" },
        { status: 400 }
      )
    }

    const items = await sql`
      SELECT distributor_medicine_id, quantity
      FROM purchase_items
      WHERE request_id = ${requestId}
    `

    for (const item of items as any[]) {
      await sql`
        UPDATE distributor_medicines
        SET reserved_quantity = GREATEST(reserved_quantity - ${item.quantity}, 0)
        WHERE id = ${item.distributor_medicine_id}
      `
    }

    await sql`
      UPDATE purchase_requests
      SET status = 'REJECTED',
          updated_at = NOW()
      WHERE id = ${requestId}
    `

    return NextResponse.json({ success: true, status: "REJECTED" })
  } catch (error: any) {
    console.error("[ADMIN PURCHASE REQUESTS] Reject error:", error)
    return NextResponse.json(
      { error: "Failed to reject purchase request", details: String(error) },
      { status: 500 }
    )
  }
}

