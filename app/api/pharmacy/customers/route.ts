import { NextRequest, NextResponse } from 'next/server'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''

    const where: string[] = [`c.pharmacy_id = ${pharmacyId}`]
    if (search) {
      where.push(`(c.full_name ILIKE $${where.length + 1} OR c.email ILIKE $${where.length + 1} OR COALESCE(c.phone, '') ILIKE $${where.length + 1})`)
    }
    const whereSql = where.join(' AND ')
    const searchParam = search ? `%${search}%` : undefined

    const customers = await sql`
      SELECT
        c.id,
        c.full_name,
        c.email,
        c.phone,
        c.address,
        c.notes,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent,
        MAX(o.created_at) AS last_order_at
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id AND o.pharmacy_id = ${pharmacyId}
      WHERE ${sql.unsafe(whereSql)}
      GROUP BY c.id
      ORDER BY last_order_at DESC NULLS LAST
      LIMIT 50
    `

    return ok({ customers })
  } catch (error) {
    return handleApiError(error, 'PHARMACY CUSTOMERS')
  }
}
