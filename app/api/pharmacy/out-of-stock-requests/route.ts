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
      FROM out_of_stock_requests osr
      JOIN medicines m ON m.id = osr.medicine_id
      JOIN distributor_profiles dp ON dp.id = osr.distributor_id
      WHERE osr.pharmacy_id = ${pharmacyId}
        ${status ? sql`AND osr.status = ${status}` : sql``}
        ${search ? sql`AND (m.name ILIKE ${'%' + search + '%'} OR dp.company_name ILIKE ${'%' + search + '%'})` : sql``}
    `
    const total = Number(countRow[0]?.total || 0)

    const requests = await sql`
      SELECT
        osr.id,
        osr.pharmacy_id,
        osr.distributor_id,
        osr.medicine_id,
        osr.distributor_medicine_id,
        osr.requested_quantity,
        osr.mrp,
        osr.unit_price,
        osr.status,
        osr.notes,
        osr.fulfilled_at,
        osr.created_at,
        osr.updated_at,
        m.name AS medicine_name,
        m.generic_name,
        m.manufacturer,
        dp.company_name AS distributor_name
      FROM out_of_stock_requests osr
      JOIN medicines m ON m.id = osr.medicine_id
      JOIN distributor_profiles dp ON dp.id = osr.distributor_id
      WHERE osr.pharmacy_id = ${pharmacyId}
        ${status ? sql`AND osr.status = ${status}` : sql``}
        ${search ? sql`AND (m.name ILIKE ${'%' + search + '%'} OR dp.company_name ILIKE ${'%' + search + '%'})` : sql``}
      ORDER BY osr.created_at DESC
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
    return handleApiError(error, 'PHARMACY OUT OF STOCK REQUESTS')
  }
}
