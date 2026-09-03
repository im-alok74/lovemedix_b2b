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
    const status = searchParams.get('status')?.trim() || ''
    const search = searchParams.get('search')?.trim() || ''
    const offset = (page - 1) * limit

    const countRow = await sql<{ total: string }>`
      SELECT COUNT(*)::text AS total
      FROM b2b_orders bo
      JOIN distributor_profiles dp ON dp.id = bo.distributor_id
      WHERE bo.pharmacy_id = ${pharmacyId}
        ${status ? sql`AND bo.order_status = ${status}` : sql``}
        ${search ? sql`AND (bo.order_number ILIKE ${'%' + search + '%'} OR dp.company_name ILIKE ${'%' + search + '%'})` : sql``}
    `
    const total = Number(countRow[0]?.total || 0)

    const orders = await sql`
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
        dp.city AS distributor_city,
        dp.state AS distributor_state,
        COUNT(boi.id) AS item_count,
        SUM(boi.quantity) AS total_items
      FROM b2b_orders bo
      JOIN distributor_profiles dp ON dp.id = bo.distributor_id
      LEFT JOIN b2b_order_items boi ON boi.order_id = bo.id
      WHERE bo.pharmacy_id = ${pharmacyId}
        ${status ? sql`AND bo.order_status = ${status}` : sql``}
        ${search ? sql`AND (bo.order_number ILIKE ${'%' + search + '%'} OR dp.company_name ILIKE ${'%' + search + '%'})` : sql``}
      GROUP BY bo.id, dp.id
      ORDER BY bo.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return ok({
      items: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'PHARMACY ORDERS')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const body = await request.json()
    const { distributorId, items, notes } = body

    if (!distributorId || !Array.isArray(items) || items.length === 0) {
      return badRequest('distributorId and items are required')
    }

    const distributor = await sql`
      SELECT id FROM distributor_profiles WHERE id = ${distributorId} AND verification_status = 'VERIFIED' LIMIT 1
    `
    if (!distributor.length) {
      return notFound('Distributor not found or not verified')
    }

    let subtotal = 0
    const validatedItems: any[] = []

    for (const item of items) {
      const { distributorMedicineId, quantity } = item
      if (!distributorMedicineId || !quantity || quantity <= 0) {
        return badRequest('Each item must have distributorMedicineId and a positive quantity')
      }

      const dmRows = await sql`
        SELECT id, medicine_id, unit_price, quantity AS stock_quantity, reserved_quantity
        FROM distributor_medicines
        WHERE id = ${distributorMedicineId} AND distributor_id = ${distributorId} AND is_active = true
        LIMIT 1
      `
      if (!dmRows.length) {
        return notFound(`Distributor medicine ${distributorMedicineId} not found`)
      }

      const dm = dmRows[0]
      const available = Number(dm.stock_quantity) - Number(dm.reserved_quantity)
      if (Number(quantity) > available) {
        return badRequest(`Insufficient stock for medicine id ${dm.medicine_id}. Available: ${available}`)
      }

      const lineTotal = Number(dm.unit_price) * Number(quantity)
      subtotal += lineTotal

      validatedItems.push({
        medicineId: dm.medicine_id,
        distributorMedicineId: dm.id,
        quantity: Number(quantity),
        unitPrice: Number(dm.unit_price),
        lineTotal,
      })
    }

    const orderNumber = `B2B-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const taxAmount = Number((subtotal * 0.05).toFixed(2))
    const totalAmount = Number((subtotal + taxAmount).toFixed(2))

    const orderResult = await sql`
      INSERT INTO b2b_orders (
        order_number, pharmacy_id, distributor_id, subtotal, tax_amount,
        discount_amount, total_amount, order_status, payment_status, notes
      )
      VALUES (
        ${orderNumber}, ${pharmacyId}, ${distributorId}, ${subtotal}, ${taxAmount},
        0, ${totalAmount}, 'PENDING', 'PENDING', ${notes || null}
      )
      RETURNING id
    `

    const orderId = orderResult[0].id

    for (const vi of validatedItems) {
      await sql`
        INSERT INTO b2b_order_items (
          order_id, medicine_id, distributor_medicine_id, quantity, unit_price, line_total, batch_number, expiry_date
        )
        SELECT
          ${orderId},
          ${vi.medicineId},
          ${vi.distributorMedicineId},
          ${vi.quantity},
          ${vi.unitPrice},
          ${vi.lineTotal},
          dm.batch_number,
          dm.expiry_date
        FROM distributor_medicines dm
        WHERE dm.id = ${vi.distributorMedicineId}
      `
      await sql`
        UPDATE distributor_medicines
        SET reserved_quantity = reserved_quantity + ${vi.quantity}, updated_at = NOW()
        WHERE id = ${vi.distributorMedicineId}
      `
    }

    revalidatePath('/pharmacy/orders')
    return ok({ orderId, orderNumber, totalAmount }, 201)
  } catch (error) {
    return handleApiError(error, 'PHARMACY CREATE ORDER')
  }
}
