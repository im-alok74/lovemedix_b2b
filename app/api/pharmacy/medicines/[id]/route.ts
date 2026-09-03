import { NextRequest, NextResponse } from 'next/server'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const medicineId = Number((await params).id)

    if (Number.isNaN(medicineId)) {
      return badRequest('Invalid medicine id')
    }

    const medicineRows = await sql`
      SELECT
        m.id,
        m.name,
        m.generic_name,
        m.manufacturer,
        m.form,
        m.strength,
        m.pack_size,
        m.mrp,
        m.gst_rate,
        m.requires_prescription,
        m.photo_url,
        m.status,
        m.slug,
        m.description,
        c.name AS category_name,
        COALESCE(
          json_agg(mi.image_url) FILTER (WHERE mi.image_url IS NOT NULL),
          '[]'
        ) AS images
      FROM medicines m
      LEFT JOIN categories c ON c.id = m.category_id
      LEFT JOIN medicine_images mi ON mi.medicine_id = m.id
      WHERE m.id = ${medicineId} AND m.status = 'ACTIVE'
      GROUP BY m.id, c.id
      LIMIT 1
    `

    if (!medicineRows.length) {
      return notFound('Medicine not found')
    }

    const listings = await sql`
      SELECT
        dm.id AS distributor_medicine_id,
        dm.unit_price,
        dm.quantity,
        dm.reserved_quantity,
        (dm.quantity - dm.reserved_quantity) AS available_quantity,
        dm.batch_number,
        dm.expiry_date,
        dm.hsn_code,
        dp.id AS distributor_id,
        dp.company_name,
        dp.city AS distributor_city,
        dp.state AS distributor_state
      FROM distributor_medicines dm
      JOIN distributor_profiles dp ON dp.id = dm.distributor_id
      WHERE dm.medicine_id = ${medicineId}
        AND dm.is_active = true
        AND dm.quantity > dm.reserved_quantity
        AND dp.verification_status = 'VERIFIED'
      ORDER BY dm.unit_price ASC
    `

    return ok({
      medicine: medicineRows[0],
      distributor_listings: listings,
    })
  } catch (error) {
    return handleApiError(error, 'PHARMACY MEDICINE DETAIL')
  }
}
