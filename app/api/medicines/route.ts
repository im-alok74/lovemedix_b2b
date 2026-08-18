import { NextResponse, type NextRequest } from "next/server"

import { sql } from "@/lib/db"

/**
 * Public catalogue feed: one best active offer per medicine from verified pharmacies.
 *
 * This endpoint had three problems that together made it a standing bandwidth liability:
 *
 *  1. **Unbounded.** No LIMIT, so it returned every stocked medicine in one response.
 *  2. **Selected `description`.** That column averages ~1.8 KB per row and is 89% of the
 *     payload, and no consumer of this endpoint rendered it.
 *  3. **Uncacheable and unauthenticated.** Every hit — including from crawlers, which do
 *     find bare `/api/*` routes — went straight through to Neon.
 *
 * Nothing in the application calls it today, so it is most likely serving bots. Rather
 * than remove a public route, it is now bounded, trimmed to display fields, and cached at
 * the edge so repeat hits never reach the database.
 */

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(params.get("limit")) || DEFAULT_LIMIT))
    const offset = Math.max(0, Number(params.get("offset")) || 0)

    const medicines = await sql`
      SELECT DISTINCT ON (m.id)
        m.id,
        m.name,
        m.slug,
        m.generic_name,
        m.strength,
        m.form,
        m.pack_size,
        m.manufacturer,
        m.mrp,
        m.image_url,
        m.requires_prescription,
        pi.selling_price,
        pi.discount_percentage,
        pp.pharmacy_name
      FROM pharmacy_inventory pi
      JOIN pharmacy_profiles pp
        ON pp.id = pi.pharmacy_id
       AND pp.verification_status = 'verified'
      JOIN medicines m
        ON m.id = pi.medicine_id
      WHERE m.status = 'active'
        AND pi.stock_quantity > 0
        AND (pi.expiry_date IS NULL OR pi.expiry_date >= CURRENT_DATE)
      ORDER BY m.id, COALESCE(pi.discount_percentage, 0) DESC, pi.selling_price ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    return NextResponse.json(
      { medicines, limit, offset },
      {
        headers: {
          // Public, identical for every caller. Served from the edge for a minute, and
          // stale copies may be served for an hour while a fresh one is fetched in the
          // background — so a burst of bot traffic costs at most one query per minute.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600",
        },
      },
    )
  } catch (error) {
    console.error("[api/medicines] failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
