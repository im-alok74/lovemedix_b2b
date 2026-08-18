import type { NextRequest } from "next/server"

import { requireRole } from "@/lib/auth-server"
import { handleApiError, ok } from "@/lib/api-response"
import { query } from "@/lib/db"

interface AdminPrescriptionRow {
  id: number
  image_url: string
  status: string
  created_at: string
  patient_name: string | null
  doctor_name: string | null
  customer_name: string
  customer_email: string
}

/**
 * Admin prescription verification queue.
 *
 * The previous version read `result.rows`, but the Neon driver resolves to a plain
 * array — `rows` was always undefined, so this endpoint returned an empty list on every
 * call and the verification queue looked permanently empty.
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin"])

    const status = request.nextUrl.searchParams.get("status")
    const statusFilter = status && status !== "all" ? status : null

    const prescriptions = await query<AdminPrescriptionRow>`
      SELECT
        p.id,
        p.prescription_image AS image_url,
        p.status,
        p.created_at,
        p.patient_name,
        p.doctor_name,
        u.full_name AS customer_name,
        u.email     AS customer_email
      FROM prescriptions p
      JOIN users u ON p.customer_id = u.id
      WHERE (${statusFilter}::text IS NULL OR p.status = ${statusFilter})
      ORDER BY
        -- Pending items first: this is a work queue, not an archive.
        CASE WHEN p.status = 'pending' THEN 0 ELSE 1 END,
        p.created_at DESC
      LIMIT 200
    `

    return ok({ prescriptions })
  } catch (error) {
    return handleApiError(error, "admin/prescriptions")
  }
}
