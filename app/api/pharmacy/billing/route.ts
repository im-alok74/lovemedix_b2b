import { NextRequest, NextResponse } from 'next/server'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '10')))
    const offset = (page - 1) * limit

    const countRow = await sql<{ total: string }>`
      SELECT COUNT(*)::text AS total
      FROM purchase_invoices pi
      JOIN purchase_requests pr ON pr.id = pi.request_id
      WHERE pr.pharmacy_id = ${pharmacyId}
    `
    const total = Number(countRow[0]?.total || 0)

    const invoices = await sql`
      SELECT
        pi.id,
        pi.invoice_number,
        pi.invoice_date,
        pi.due_date,
        pi.subtotal,
        pi.tax_amount,
        pi.total_amount,
        pi.payment_status,
        pi.paid_at,
        pi.payment_method,
        pi.transaction_ref,
        pr.id AS purchase_request_id,
        dp.company_name AS distributor_name
      FROM purchase_invoices pi
      JOIN purchase_requests pr ON pr.id = pi.request_id
      JOIN distributor_profiles dp ON dp.id = pr.distributor_id
      WHERE pr.pharmacy_id = ${pharmacyId}
      ORDER BY pi.invoice_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return ok({
      invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'PHARMACY BILLING')
  }
}
