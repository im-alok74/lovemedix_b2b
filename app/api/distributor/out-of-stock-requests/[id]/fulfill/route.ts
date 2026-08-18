import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // `user.role` does not exist on User — the field is `user_type`. The old check was
  // therefore `undefined !== "distributor"`, always true, so this endpoint returned 401
  // to every caller and no distributor could ever fulfil a request.
  const user = await getCurrentUser()
  if (!user || user.user_type !== "distributor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { quantity_offered, notes } = body

    // Get distributor profile
    const distributorResult = await sql`
      SELECT id FROM distributor_profiles WHERE user_id = ${user.id}
    `

    if (distributorResult.length === 0) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    const distributorId = distributorResult[0].id

    // Get request details
    const reqResult = await sql`
      SELECT * FROM medicine_out_of_stock_requests WHERE id = ${id} AND distributor_id = ${distributorId}
    `

    if (reqResult.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    const req = reqResult[0]

    // Validate request status
    if (!["pending", "assigned"].includes(req.status)) {
      return NextResponse.json(
        { error: `Cannot fulfill ${req.status} request` },
        { status: 400 }
      )
    }

    // Check if distributor medicine has enough quantity
    if (quantity_offered && quantity_offered > 0) {
      const dmResult = await sql`
        SELECT quantity FROM distributor_medicines WHERE id = ${req.distributor_medicine_id}
      `

      if (dmResult.length === 0) {
        return NextResponse.json(
          { error: "Distributor medicine not found" },
          { status: 404 }
        )
      }

      const dmQuantity = dmResult[0].quantity

      if (quantity_offered > dmQuantity) {
        return NextResponse.json(
          { error: `Only ${dmQuantity} units available` },
          { status: 400 }
        )
      }

      // Check if quantity offered is less than requested, create partial fulfillment note
      if (quantity_offered < req.requested_quantity) {
        console.log(
          `[v0] Partial fulfillment: ${quantity_offered}/${req.requested_quantity}`
        )
      }
    }

    // Update out-of-stock request status
    const updateResult = await sql`
      UPDATE medicine_out_of_stock_requests
      SET status = 'fulfilled', 
          fulfilled_at = CURRENT_TIMESTAMP,
          notes = ${notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    // Create a procurement request automatically if quantity_offered > 0
    if (quantity_offered && quantity_offered > 0) {
      // Get pharmacy details for procurement request
      const pharmacyResult = await sql`
        SELECT id FROM pharmacy_profiles WHERE id = ${req.pharmacy_id}
      `

      if (pharmacyResult.length > 0) {
        // Create purchase request as auto-generated from out-of-stock
        await sql`
          INSERT INTO purchase_requests (
            pharmacy_id, distributor_id, total_amount, status, 
            is_out_of_stock_fulfillment, created_at, updated_at
          ) VALUES (${req.pharmacy_id}, ${distributorId}, ${(req.unit_price || 0) * quantity_offered}, 'approved', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `
      }
    }

    // Log audit trail
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
      VALUES (${user.id}, 'fulfill_out_of_stock_request', 'medicine_out_of_stock_requests', ${id},
        ${JSON.stringify({
          quantity_offered,
          created_procurement_request: quantity_offered ? true : false,
        })}, CURRENT_TIMESTAMP)
    `

    return NextResponse.json(updateResult[0])
  } catch (error) {
    console.error("Error fulfilling request:", error)
    return NextResponse.json(
      { error: "Failed to fulfill request" },
      { status: 500 }
    )
  }
}
