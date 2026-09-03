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
    const stockFilter = searchParams.get('stock') || 'all'
    const offset = (page - 1) * limit

    const countRow = await sql<{ total: string }>`
      SELECT COUNT(*)::text AS total
      FROM pharmacy_inventory pi
      JOIN medicines m ON m.id = pi.medicine_id
      WHERE pi.pharmacy_id = ${pharmacyId}
        ${search ? sql`AND (m.name ILIKE ${'%' + search + '%'} OR m.generic_name ILIKE ${'%' + search + '%'})` : sql``}
        ${stockFilter === 'in_stock' ? sql`AND pi.quantity > 0` : stockFilter === 'out_of_stock' ? sql`AND pi.quantity = 0` : stockFilter === 'low_stock' ? sql`AND pi.quantity > 0 AND pi.quantity < 10` : sql``}
    `
    const total = Number(countRow[0]?.total || 0)

    const items = await sql`
      SELECT
        pi.id,
        pi.medicine_id,
        pi.batch_number,
        pi.mfg_date,
        pi.expiry_date,
        pi.mrp,
        pi.quantity,
        pi.selling_price,
        pi.discount_percent,
        pi.is_active,
        pi.created_at,
        pi.updated_at,
        m.name AS medicine_name,
        m.generic_name,
        m.manufacturer,
        m.form,
        m.strength,
        m.pack_size,
        m.photo_url AS medicine_image,
        COALESCE(
          json_agg(mi.image_url) FILTER (WHERE mi.image_url IS NOT NULL),
          '[]'
        ) AS images
      FROM pharmacy_inventory pi
      JOIN medicines m ON m.id = pi.medicine_id
      LEFT JOIN medicine_images mi ON mi.medicine_id = m.id
      WHERE pi.pharmacy_id = ${pharmacyId}
        ${search ? sql`AND (m.name ILIKE ${'%' + search + '%'} OR m.generic_name ILIKE ${'%' + search + '%'})` : sql``}
        ${stockFilter === 'in_stock' ? sql`AND pi.quantity > 0` : stockFilter === 'out_of_stock' ? sql`AND pi.quantity = 0` : stockFilter === 'low_stock' ? sql`AND pi.quantity > 0 AND pi.quantity < 10` : sql``}
      GROUP BY pi.id, m.id
      ORDER BY pi.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return ok({
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'PHARMACY INVENTORY')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const body = await request.json()
    const {
      medicineId,
      batchNumber,
      mfgDate,
      expiryDate,
      mrp,
      quantity,
      sellingPrice,
      discountPercent,
    } = body

    if (!medicineId || !expiryDate || mrp === undefined || quantity === undefined || sellingPrice === undefined) {
      return badRequest('medicineId, expiryDate, mrp, quantity, and sellingPrice are required')
    }

    const medicine = await sql`
      SELECT id FROM medicines WHERE id = ${medicineId} AND status = 'ACTIVE' LIMIT 1
    `
    if (!medicine.length) {
      return notFound('Medicine not found')
    }

    const amount = Number(quantity) * Number(sellingPrice)
    const result = await sql`
      INSERT INTO pharmacy_inventory (
        pharmacy_id, medicine_id, batch_number, mfg_date, expiry_date,
        mrp, quantity, selling_price, discount_percent, amount
      )
      VALUES (
        ${pharmacyId}, ${medicineId}, ${batchNumber || null}, ${mfgDate || null}, ${expiryDate},
        ${mrp}, ${quantity}, ${sellingPrice}, ${discountPercent ?? 0}, ${amount}
      )
      ON CONFLICT (pharmacy_id, medicine_id, batch_number)
      DO UPDATE SET
        quantity = pharmacy_inventory.quantity + EXCLUDED.quantity,
        selling_price = EXCLUDED.selling_price,
        discount_percent = EXCLUDED.discount_percent,
        mrp = EXCLUDED.mrp,
        expiry_date = COALESCE(EXCLUDED.expiry_date, pharmacy_inventory.expiry_date),
        mfg_date = COALESCE(EXCLUDED.mfg_date, pharmacy_inventory.mfg_date),
        updated_at = NOW()
      RETURNING *
    `

    revalidatePath('/pharmacy/inventory')
    return ok({ item: result[0] }, 201)
  } catch (error) {
    return handleApiError(error, 'PHARMACY INVENTORY CREATE')
  }
}
