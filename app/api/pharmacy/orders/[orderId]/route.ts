import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.user_type !== "pharmacy") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pharmacyRows = await sql`
      SELECT id FROM pharmacy_profiles WHERE user_id = ${user.id} LIMIT 1
    `
    if (!pharmacyRows.length) {
      return NextResponse.json({ error: "Pharmacy profile not found" }, { status: 404 })
    }
    const pharmacyId = (pharmacyRows[0] as any).id

    const { status } = await request.json()
    const orderId = (await params).orderId

    const result = await sql`
      UPDATE orders
      SET order_status = ${status}, updated_at = NOW()
      WHERE id = ${orderId} AND pharmacy_id = ${pharmacyId}
      RETURNING id
    `

    if (!result.length) {
      return NextResponse.json({ error: "Order not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update order status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
