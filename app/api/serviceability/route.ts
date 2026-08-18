import type { NextRequest } from "next/server"

import { badRequest, handleApiError, ok } from "@/lib/api-response"
import { query } from "@/lib/db"

interface PincodeRow {
  pincode: string
  city: string | null
  state: string | null
  estimated_hours_min: number
  estimated_hours_max: number
  cod_available: boolean
}

/**
 * Public delivery-serviceability lookup.
 *
 * Falls back to "is there a verified pharmacy in this pincode?" when the pincode has no
 * explicit row, so the check stays useful before the serviceability table is populated.
 */
export async function GET(request: NextRequest) {
  try {
    const pincode = request.nextUrl.searchParams.get("pincode")?.trim() ?? ""

    if (!/^[1-9]\d{5}$/.test(pincode)) {
      return badRequest("Enter a valid 6-digit pincode")
    }

    const [row] = await query<PincodeRow>`
      SELECT pincode, city, state, estimated_hours_min, estimated_hours_max, cod_available
      FROM serviceable_pincodes
      WHERE pincode = ${pincode} AND is_active
      LIMIT 1
    `

    if (row) {
      return ok({
        serviceable: true,
        pincode,
        city: row.city,
        state: row.state,
        deliveryWindow: `${row.estimated_hours_min}–${row.estimated_hours_max} hours`,
        codAvailable: row.cod_available,
      })
    }

    const [nearby] = await query<{ count: number }>`
      SELECT COUNT(*)::int AS count
      FROM pharmacy_profiles
      WHERE pincode = ${pincode} AND verification_status = 'verified'
    `

    if (Number(nearby?.count ?? 0) > 0) {
      return ok({
        serviceable: true,
        pincode,
        city: null,
        state: null,
        deliveryWindow: "2–24 hours",
        codAvailable: true,
      })
    }

    return ok({ serviceable: false, pincode })
  } catch (error) {
    return handleApiError(error, "serviceability")
  }
}
