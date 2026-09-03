import { NextRequest, NextResponse } from 'next/server'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const orderId = Number((await params).orderId)

    if (Number.isNaN(orderId)) {
      return badRequest('Invalid order id')
    }

    const orderRows = await sql`
      SELECT
        bo.id,
        bo.order_number,
        bo.pharmacy_id,
        bo.distributor_id,
        bo.subtotal,
        bo.tax_amount,
        bo.discount_amount,
        bo.total_amount,
        bo.order_status,
        bo.payment_status,
        bo.payment_method,
        bo.notes,
        bo.created_at,
        bo.updated_at,
        dp.company_name AS distributor_name,
        dp.contact_person AS distributor_contact,
        dp.phone AS distributor_phone,
        dp.email AS distributor_email,
        dp.address_line1 AS distributor_address,
        dp.city AS distributor_city,
        dp.state AS distributor_state,
        dp.pincode AS distributor_pincode
      FROM b2b_orders bo
      JOIN distributor_profiles dp ON dp.id = bo.distributor_id
      WHERE bo.id = ${orderId} AND bo.pharmacy_id = ${pharmacyId}
      LIMIT 1
    `

    if (!orderRows.length) {
      return notFound('Order not found')
    }

    const order = orderRows[0]

    const items = await sql`
      SELECT
        boi.id,
        boi.medicine_id,
        boi.quantity,
        boi.unit_price,
        boi.discount_percent,
        boi.line_total,
        boi.batch_number,
        boi.expiry_date,
        boi.mrp,
        m.name AS medicine_name,
        m.generic_name,
        m.manufacturer,
        m.form,
        m.strength
      FROM b2b_order_items boi
      JOIN medicines m ON m.id = boi.medicine_id
      WHERE boi.order_id = ${orderId}
      ORDER BY boi.id ASC
    `

    const history = await sql`
      SELECT status, changed_by, note, created_at
      FROM b2b_order_status_history
      WHERE order_id = ${orderId}
      ORDER BY created_at ASC
    `

    return ok({ order, items, history })
  } catch (error) {
    return handleApiError(error, 'PHARMACY ORDER DETAIL')
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const orderId = Number((await params).orderId)

    if (Number.isNaN(orderId)) {
      return badRequest('Invalid order id')
    }

    const body = await request.json()
    const { orderStatus } = body

    if (!['CANCELLED'].includes(orderStatus)) {
      return badRequest('Only CANCELLED status update is allowed for pharmacies')
    }

    const existing = await sql`
      SELECT id, order_status FROM b2b_orders WHERE id = ${orderId} AND pharmacy_id = ${pharmacyId} LIMIT 1
    `
    if (!existing.length) {
      return notFound('Order not found')
    }

    if (existing[0].order_status !== 'PENDING' && existing[0].order_status !== 'CONFIRMED') {
      return badRequest('Order can only be cancelled when PENDING or CONFIRMED')
    }

    const result = await sql`
      UPDATE b2b_orders
      SET order_status = 'CANCELLED', updated_at = NOW()
      WHERE id = ${orderId} AND pharmacy_id = ${pharmacyId}
      RETURNING id
    `

    revalidatePath('/pharmacy/orders')
    return ok({ success: true })
  } catch (error) {
    return handleApiError(error, 'PHARMACY ORDER CANCEL')
  }
}
