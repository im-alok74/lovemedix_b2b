import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || user.user_type !== "distributor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || "").trim()
    const form = (searchParams.get("form") || "").trim()
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 20), 1), 50)

    if (!q) {
      return NextResponse.json({ medicines: [] })
    }

    const distributorProfile = await sql`
      SELECT id, verification_status
      FROM distributor_profiles
      WHERE user_id = ${user.id}
      LIMIT 1
    `

    if (distributorProfile.length === 0) {
      return NextResponse.json({ error: "Distributor profile not found" }, { status: 404 })
    }

    if ((distributorProfile[0] as any).verification_status !== "verified") {
      return NextResponse.json({ error: "Distributor not verified yet" }, { status: 403 })
    }

    const distributorId = (distributorProfile[0] as any).id
    const qLike = `%${q}%`

    const medicines = await sql`
      SELECT
        m.id,
        m.name,
        m.generic_name,
        m.manufacturer,
        m.form,
        m.strength,
        m.pack_size,
        m.mrp,
        m.description,
        m.image_url,
        m.source,
        EXISTS (
          SELECT 1
          FROM distributor_medicines dm
          WHERE dm.distributor_id = ${distributorId}
            AND dm.medicine_id = m.id
        ) AS in_inventory,
        GREATEST(
          similarity(COALESCE(m.name, ''), ${q}),
          similarity(COALESCE(m.generic_name, ''), ${q}),
          similarity(COALESCE(m.manufacturer, ''), ${q})
        ) AS rank_score
      FROM medicines m
      WHERE m.status = 'active'
        AND (${form === ""} OR m.form = ${form})
        AND (
          m.name ILIKE ${qLike}
          OR m.generic_name ILIKE ${qLike}
          OR m.manufacturer ILIKE ${qLike}
          OR to_tsvector(
              'simple',
              COALESCE(m.name, '') || ' ' ||
              COALESCE(m.generic_name, '') || ' ' ||
              COALESCE(m.manufacturer, '') || ' ' ||
              COALESCE(m.strength, '') || ' ' ||
              COALESCE(m.form, '')
            ) @@ plainto_tsquery('simple', ${q})
        )
      ORDER BY rank_score DESC, m.name ASC
      LIMIT ${limit}
    `

    return NextResponse.json({ medicines })
  } catch (error: any) {
    console.error("[distributor-medicine-search] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
