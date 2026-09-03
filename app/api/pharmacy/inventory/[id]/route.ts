import { NextRequest, NextResponse } from 'next/server'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const id = Number((await params).id)

    if (Number.isNaN(id)) {
      return badRequest('Invalid inventory item id')
    }

    const rows = await sql`
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
      WHERE pi.id = ${id} AND pi.pharmacy_id = ${pharmacyId}
      GROUP BY pi.id, m.id
      LIMIT 1
    `

    if (!rows.length) {
      return notFound('Inventory item not found')
    }

    return ok(rows[0])
  } catch (error) {
    return handleApiError(error, 'PHARMACY INVENTORY ITEM')
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const id = Number((await params).id)

    if (Number.isNaN(id)) {
      return badRequest('Invalid inventory item id')
    }

    const body = await request.json()
    const {
      batchNumber,
      mfgDate,
      expiryDate,
      mrp,
      quantity,
      sellingPrice,
      discountPercent,
      isActive,
    } = body

    const existing = await sql`
      SELECT id FROM pharmacy_inventory WHERE id = ${id} AND pharmacy_id = ${pharmacyId} LIMIT 1
    `
    if (!existing.length) {
      return notFound('Inventory item not found')
    }

    const result = await sql`
      UPDATE pharmacy_inventory
      SET
        batch_number = COALESCE(${batchNumber}, batch_number),
        mfg_date = COALESCE(${mfgDate}, mfg_date),
        expiry_date = COALESCE(${expiryDate}, expiry_date),
        mrp = COALESCE(${mrp}, mrp),
        quantity = COALESCE(${quantity}, quantity),
        selling_price = COALESCE(${sellingPrice}, selling_price),
        discount_percent = COALESCE(${discountPercent}, discount_percent),
        is_active = COALESCE(${isActive}, is_active),
        updated_at = NOW()
      WHERE id = ${id} AND pharmacy_id = ${pharmacyId}
      RETURNING *
    `

    revalidatePath('/pharmacy/inventory')
    return ok({ item: result[0] })
  } catch (error) {
    return handleApiError(error, 'PHARMACY INVENTORY UPDATE')
  }
}
