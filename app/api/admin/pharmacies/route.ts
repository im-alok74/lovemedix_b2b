import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin"])

    const searchParams = request.nextUrl.searchParams
    const rawQuery = searchParams.get("query")?.trim()
    const rawStatus = searchParams.get("status")?.trim()

    const query = rawQuery ? `%${rawQuery}%` : null
    const status = rawStatus && rawStatus !== "all" ? rawStatus : null

    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20))
    const offset = (page - 1) * limit

    const pharmacies = await sql`
      SELECT pp.id, pp.pharmacy_name, pp.registration_number, pp.gst_number,
             pp.contact_person, pp.phone, pp.email, pp.address_line1, pp.address_line2,
             pp.city, pp.state, pp.pincode, pp.license_number, pp.license_expiry,
             pp.verification_status, pp.verified_at, pp.commission_rate, pp.notes,
             pp.created_at, pp.updated_at,
             u.id AS user_id, u.email AS user_email, u.full_name, u.phone AS user_phone,
             u.status AS user_status
      FROM pharmacy_profiles pp
      JOIN users u ON pp.user_id = u.id
      WHERE (${query}::text IS NULL
             OR pp.pharmacy_name ILIKE ${query}
             OR pp.contact_person ILIKE ${query}
             OR pp.city ILIKE ${query})
        AND (${status}::text IS NULL OR pp.verification_status = ${status})
      ORDER BY pp.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*)::int AS total
      FROM pharmacy_profiles pp
      WHERE (${query}::text IS NULL
             OR pp.pharmacy_name ILIKE ${query}
             OR pp.contact_person ILIKE ${query}
             OR pp.city ILIKE ${query})
        AND (${status}::text IS NULL OR pp.verification_status = ${status})
    `

    const total = Number(countResult[0]?.total ?? 0)

    return NextResponse.json({
      success: true,
      pharmacies,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.error("[admin/pharmacies] GET error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Failed to fetch pharmacies" }, { status: 500 })
  }
}
