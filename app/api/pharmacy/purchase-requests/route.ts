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
      FROM purchase_requests pr
      JOIN distributor_profiles dp ON dp.id = pr.distributor_id
      WHERE pr.pharmacy_id = ${pharmacyId}
        ${status ? sql`AND pr.status = ${status}` : sql``}
        ${search ? sql`AND dp.company_name ILIKE ${'%' + search + '%'}` : sql``}
    `
    const total = Number(countRow[0]?.total || 0)

    const requests = await sql`
      SELECT
        pr.id,
        pr.pharmacy_id,
        pr.distributor_id,
        pr.status,
        pr.total_amount,
        pr.notes,
        pr.expires_at,
        pr.fulfilled_at,
        pr.cancelled_at,
        pr.created_at,
        pr.updated_at,
        dp.company_name AS distributor_name,
        dp.city AS distributor_city,
        dp.state AS distributor_state,
        COUNT(pi.id) AS item_count,
        SUM(pi.quantity) AS total_quantity,
        pi_inv.invoice_number,
        pi_inv.payment_status AS invoice_payment_status,
        pi_inv.paid_at AS invoice_paid_at
      FROM purchase_requests pr
      JOIN distributor_profiles dp ON dp.id = pr.distributor_id
      LEFT JOIN purchase_items pi ON pi.request_id = pr.id
      LEFT JOIN purchase_invoices pi_inv ON pi_inv.request_id = pr.id
      WHERE pr.pharmacy_id = ${pharmacyId}
        ${status ? sql`AND pr.status = ${status}` : sql``}
        ${search ? sql`AND dp.company_name ILIKE ${'%' + search + '%'}` : sql``}
      GROUP BY pr.id, dp.id, pi_inv.id
      ORDER BY pr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return ok({
      items: requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'PHARMACY PURCHASE REQUESTS')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const body = await request.json()
    const { items, notes } = body

    if (!Array.isArray(items) || items.length === 0) {
      return badRequest('No items provided')
    }

    let totalAmount = 0
    let distributorId: number | null = null
    const validatedItems: any[] = []

    for (const item of items) {
      const { distributorMedicineId, quantity } = item
      if (!distributorMedicineId || !quantity || quantity <= 0) {
        return badRequest('Invalid item payload')
      }

      const dmRows = await sql`
        SELECT id, medicine_id, unit_price, quantity AS stock_quantity, reserved_quantity, batch_number, expiry_date, distributor_id
        FROM distributor_medicines
        WHERE id = ${distributorMedicineId} AND is_active = true
        LIMIT 1
      `
      if (!dmRows.length) {
        return notFound(`Distributor medicine ${distributorMedicineId} not found`)
      }

      const dm = dmRows[0] as any
      const available = Number(dm.stock_quantity) - Number(dm.reserved_quantity)
      if (Number(quantity) > available) {
        return badRequest(`Insufficient stock for medicine id ${dm.medicine_id}. Available: ${available}`)
      }

      if (distributorId === null) {
        distributorId = Number(dm.distributor_id)
      } else if (Number(dm.distributor_id) !== distributorId) {
        return badRequest('A single purchase request must contain items from only one distributor')
      }

      const price = Number(dm.unit_price)
      const lineTotal = price * Number(quantity)
      totalAmount += lineTotal

      validatedItems.push({
        medicineId: dm.medicine_id,
        distributorMedicineId: dm.id,
        quantity: Number(quantity),
        price,
        lineTotal,
        batchNumber: dm.batch_number,
        expiryDate: dm.expiry_date,
      })
    }

    const expiresAtRows = await sql`SELECT NOW() + INTERVAL '30 minutes' AS expires_at`
    const expiresAt = (expiresAtRows[0] as any).expires_at

    const prRows = await sql`
      INSERT INTO purchase_requests (pharmacy_id, distributor_id, status, total_amount, notes, expires_at)
      VALUES (${pharmacyId}, ${distributorId}, 'PENDING', ${totalAmount}, ${notes || null}, ${expiresAt})
      RETURNING *
    `
    const pr = prRows[0] as any

    for (const vi of validatedItems) {
      await sql`
        INSERT INTO purchase_items (
          request_id, distributor_medicine_id, quantity, price, line_total,
          medicine_id, pharmacy_id, distributor_id, batch_number, expiry_date
        )
        VALUES (
          ${pr.id}, ${vi.distributorMedicineId}, ${vi.quantity}, ${vi.price}, ${vi.lineTotal},
          ${vi.medicineId}, ${pharmacyId}, ${distributorId}, ${vi.batchNumber}, ${vi.expiryDate}
        )
      `
      await sql`
        UPDATE distributor_medicines
        SET reserved_quantity = reserved_quantity + ${vi.quantity}, updated_at = NOW()
        WHERE id = ${vi.distributorMedicineId}
      `
    }

    revalidatePath('/pharmacy/purchase-requests')
    return ok({ request: pr }, 201)
  } catch (error) {
    return handleApiError(error, 'PHARMACY PURCHASE REQUEST CREATE')
  }
}
