import type { NextRequest } from "next/server"
import { z } from "zod"

import { requireUser } from "@/lib/auth-server"
import { badRequest, handleApiError, ok } from "@/lib/api-response"
import { query, sql } from "@/lib/db"
import { safeParse } from "@/lib/validation"

const BodySchema = z.object({
  medicineId: z.coerce.number().int().positive(),
})

export async function GET() {
  try {
    const user = await requireUser()

    const items = await query`
      SELECT
        m.id, m.name, m.slug, m.generic_name, m.manufacturer, m.category,
        m.strength, m.pack_size, m.mrp, m.image_url, m.photo_url,
        m.requires_prescription, m.status,
        w.created_at AS saved_at,
        -- Cheapest live offer, so the wishlist shows a price the customer can act on.
        (SELECT MIN(pi.selling_price * (1 - COALESCE(pi.discount_percentage, 0) / 100.0))
           FROM pharmacy_inventory pi
           JOIN pharmacy_profiles pp ON pp.id = pi.pharmacy_id
          WHERE pi.medicine_id = m.id
            AND pp.verification_status = 'verified'
            AND pi.stock_quantity > 0) AS best_price
      FROM wishlist_items w
      JOIN medicines m ON m.id = w.medicine_id
      WHERE w.user_id = ${user.id}
      ORDER BY w.created_at DESC
    `

    return ok({ items })
  } catch (error) {
    return handleApiError(error, "wishlist:GET")
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()

    const parsed = safeParse(BodySchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error)

    // ON CONFLICT makes a double-click idempotent instead of a 409.
    await sql`
      INSERT INTO wishlist_items (user_id, medicine_id)
      VALUES (${user.id}, ${parsed.data.medicineId})
      ON CONFLICT (user_id, medicine_id) DO NOTHING
    `

    return ok({ success: true, saved: true })
  } catch (error) {
    return handleApiError(error, "wishlist:POST")
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser()

    const parsed = safeParse(BodySchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error)

    await sql`
      DELETE FROM wishlist_items
      WHERE user_id = ${user.id} AND medicine_id = ${parsed.data.medicineId}
    `

    return ok({ success: true, saved: false })
  } catch (error) {
    return handleApiError(error, "wishlist:DELETE")
  }
}
