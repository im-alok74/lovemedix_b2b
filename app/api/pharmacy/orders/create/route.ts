import { NextRequest, NextResponse } from 'next/server'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'

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
        SELECT id, medicine_id, unit_price, quantity AS stock_quantity, reserved_quantity, batch_number, expiry_date
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
        batchNumber: dm.batch_number,
        expiryDate: dm.expiry_date,
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
        VALUES (
          ${orderId},
          ${vi.medicineId},
          ${vi.distributorMedicineId},
          ${vi.quantity},
          ${vi.unitPrice},
          ${vi.lineTotal},
          ${vi.batchNumber},
          ${vi.expiryDate}
        )
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
