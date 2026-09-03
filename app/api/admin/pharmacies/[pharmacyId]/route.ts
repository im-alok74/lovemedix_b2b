import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { sql } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pharmacyId: string }> }
) {
  try {
    const user = await requireRole(["admin"])
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pharmacyId } = await params
    const id = Number(pharmacyId)

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid pharmacy ID" }, { status: 400 })
    }

    const result = await sql`
      SELECT pp.*, u.id AS user_id, u.email AS user_email, u.full_name, u.phone AS user_phone,
             u.status AS user_status
      FROM pharmacy_profiles pp
      JOIN users u ON pp.user_id = u.id
      WHERE pp.id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      pharmacy: result[0],
    })
  } catch (error) {
    console.error("[admin/pharmacies] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch pharmacy" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pharmacyId: string }> }
) {
  try {
    const user = await requireRole(["admin"])
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pharmacyId } = await params
    const id = Number(pharmacyId)

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid pharmacy ID" }, { status: 400 })
    }

    const body = await request.json()
    const { verification_status, commission_rate, notes } = body

    if (verification_status) {
      const validStatuses = ["PENDING", "VERIFIED", "REJECTED"]
      if (!validStatuses.includes(verification_status)) {
        return NextResponse.json({ error: "Invalid verification status" }, { status: 400 })
      }
    }

    const result = await sql`
      UPDATE pharmacy_profiles
      SET
        verification_status = COALESCE(${verification_status || null}, verification_status),
        commission_rate = COALESCE(${commission_rate !== undefined ? commission_rate : null}, commission_rate),
        notes = COALESCE(${notes !== undefined ? notes : null}, notes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 })
    }

    revalidatePath("/admin/pharmacies")

    return NextResponse.json({
      success: true,
      pharmacy: result[0],
      message: "Pharmacy updated successfully",
    })
  } catch (error) {
    console.error("[admin/pharmacies] PATCH error:", error)
    return NextResponse.json({ error: "Failed to update pharmacy" }, { status: 500 })
  }
}
