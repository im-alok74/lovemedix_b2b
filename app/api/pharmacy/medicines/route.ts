import { NextRequest, NextResponse } from 'next/server'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'

const MAX_PAGE_SIZE = 50

export async function GET(request: NextRequest) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get('limit') || '10')))
    const search = searchParams.get('search')?.trim() || ''
    const categoryId = searchParams.get('category')?.trim() || ''
    const offset = (page - 1) * limit

    const countRow = await sql<{ total: string }>`
      SELECT COUNT(*)::text AS total
      FROM medicines m
      WHERE m.status = 'ACTIVE'
        ${search ? sql`AND (m.name ILIKE ${'%' + search + '%'} OR m.generic_name ILIKE ${'%' + search + '%'})` : sql``}
        ${categoryId ? sql`AND m.category_id = ${Number(categoryId)}` : sql``}
    `
    const total = Number(countRow[0]?.total || 0)

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
        m.gst_rate,
        m.requires_prescription,
        m.photo_url,
        m.status,
        m.slug,
        c.name AS category_name,
        COALESCE(
          json_agg(mi.image_url) FILTER (WHERE mi.image_url IS NOT NULL),
          '[]'
        ) AS images,
        COALESCE(
          json_agg(
            json_build_object(
              'distributor_id', dm.distributor_id,
              'distributor_medicine_id', dm.id,
              'unit_price', dm.unit_price,
              'quantity', dm.quantity,
              'batch_number', dm.batch_number,
              'expiry_date', dm.expiry_date,
              'company_name', dp.company_name,
              'available_quantity', (dm.quantity - dm.reserved_quantity)
            )
          ) FILTER (WHERE dm.id IS NOT NULL),
          '[]'
        ) AS distributor_listings
      FROM medicines m
      LEFT JOIN categories c ON c.id = m.category_id
      LEFT JOIN medicine_images mi ON mi.medicine_id = m.id
      LEFT JOIN distributor_medicines dm ON dm.medicine_id = m.id AND dm.is_active = true AND dm.quantity > dm.reserved_quantity
      LEFT JOIN distributor_profiles dp ON dp.id = dm.distributor_id AND dp.verification_status = 'VERIFIED'
      WHERE m.status = 'ACTIVE'
        ${search ? sql`AND (m.name ILIKE ${'%' + search + '%'} OR m.generic_name ILIKE ${'%' + search + '%'})` : sql``}
        ${categoryId ? sql`AND m.category_id = ${Number(categoryId)}` : sql``}
      GROUP BY m.id, c.id
      ORDER BY m.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    return ok({
      items: medicines,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'PHARMACY MEDICINES CATALOG')
  }
}
