import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user || user.user_type !== "pharmacy") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    // Get pharmacy profile
    const pharmacyResult = await sql`
      SELECT id FROM pharmacy_profiles WHERE user_id = ${user.id}
    `

    if (pharmacyResult.length === 0) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 })
    }

    const pharmacyId = pharmacyResult[0].id

    // Get request details to verify ownership
    const reqResult = await sql`
      SELECT * FROM medicine_out_of_stock_requests WHERE id = ${id} AND pharmacy_id = ${pharmacyId}
    `

    if (reqResult.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    const req = reqResult[0]

    // Only allow cancellation if request is pending or assigned
    if (!["pending", "assigned"].includes(req.status)) {
      return NextResponse.json(
        { error: `Cannot cancel ${req.status} request` },
        { status: 400 }
      )
    }

    // Update request status to cancelled
    const result = await sql`
      UPDATE medicine_out_of_stock_requests
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    // Log audit trail
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES (${user.id}, 'cancel_out_of_stock_request', 'medicine_out_of_stock_requests', ${id},
        ${JSON.stringify({ cancelled_by_pharmacy: true })}, CURRENT_TIMESTAMP)
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error cancelling request:", error)
    return NextResponse.json(
      { error: "Failed to cancel request" },
      { status: 500 }
    )
  }
}
