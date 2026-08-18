import type { NextRequest } from "next/server"
import { z } from "zod"

import { requireRole } from "@/lib/auth-server"
import { badRequest, handleApiError, ok } from "@/lib/api-response"
import { sql } from "@/lib/db"
import { safeParse } from "@/lib/validation"

/**
 * Admin medicine catalog.
 *
 * The previous GET used `sql.raw()` and `sql.empty`, neither of which exists on the
 * Neon HTTP driver — every request threw a TypeError, so the admin medicines table
 * never rendered. It also hardcoded `total = 0`, so pagination could never work.
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin"])

    const searchParams = request.nextUrl.searchParams
    const rawQuery = searchParams.get("query")?.trim()
    const rawCategory = searchParams.get("category")?.trim()

    const query = rawQuery ? `%${rawQuery}%` : null
    const category = rawCategory && rawCategory !== "all" ? rawCategory : null

    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20))
    const offset = (page - 1) * limit

    const medicines = await sql`
      SELECT id, name, generic_name, manufacturer, category, form, strength, pack_size,
             mrp, gst_rate, requires_prescription, hsn_code, photo_url, image_url,
             description, mfg_date, status, slug
      FROM medicines
      WHERE (${query}::text IS NULL
             OR name ILIKE ${query}
             OR generic_name ILIKE ${query}
             OR manufacturer ILIKE ${query})
        AND (${category}::text IS NULL OR category = ${category})
      ORDER BY name ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*)::int AS total
      FROM medicines
      WHERE (${query}::text IS NULL
             OR name ILIKE ${query}
             OR generic_name ILIKE ${query}
             OR manufacturer ILIKE ${query})
        AND (${category}::text IS NULL OR category = ${category})
    `

    const total = Number(countResult[0]?.total ?? 0)

    return ok({
      medicines,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      currentPage: page,
    })
  } catch (error) {
    return handleApiError(error, "admin/medicines:GET")
  }
}

const CreateMedicineSchema = z.object({
  name: z.string().trim().min(2, "Medicine name is required").max(255),
  generic_name: z.string().trim().max(255).optional().nullable(),
  manufacturer: z.string().trim().max(255).optional().nullable(),
  category: z.string().trim().min(1, "Category is required").max(100),
  form: z.string().trim().max(50).optional().nullable(),
  strength: z.string().trim().max(50).optional().nullable(),
  pack_size: z.string().trim().max(50).optional().nullable(),
  mrp: z.coerce.number().nonnegative("MRP cannot be negative"),
  gst_rate: z.coerce.number().min(0).max(28).default(5),
  requires_prescription: z.coerce.boolean().default(false),
  hsn_code: z.string().trim().max(20).optional().nullable(),
  photo_url: z.string().trim().url().optional().nullable().or(z.literal("")),
  description: z.string().trim().max(5000).optional().nullable(),
  mfg_date: z.string().trim().optional().nullable().or(z.literal("")),
})

export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin"])

    const parsed = safeParse(CreateMedicineSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, "VALIDATION_ERROR")

    const m = parsed.data

    const result = await sql`
      INSERT INTO medicines (
        name, generic_name, manufacturer, category, form, strength, pack_size,
        mrp, gst_rate, requires_prescription, hsn_code, photo_url, description, mfg_date
      )
      VALUES (
        ${m.name}, ${m.generic_name || null}, ${m.manufacturer || null}, ${m.category},
        ${m.form || null}, ${m.strength || null}, ${m.pack_size || null},
        ${m.mrp}, ${m.gst_rate}, ${m.requires_prescription},
        ${m.hsn_code || null}, ${m.photo_url || null}, ${m.description || null},
        ${m.mfg_date || null}
      )
      RETURNING *
    `

    const medicine = result[0]

    // Slug is generated from the row's own id, so it can only be set post-insert.
    const slug =
      `${m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${medicine.id}`

    await sql`UPDATE medicines SET slug = ${slug} WHERE id = ${medicine.id}`

    return ok({ success: true, medicine: { ...medicine, slug } }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "admin/medicines:POST")
  }
}
