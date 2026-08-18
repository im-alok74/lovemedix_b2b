import type { NextRequest } from "next/server"

import { requireRole } from "@/lib/auth-server"
import { handleApiError, ok } from "@/lib/api-response"
import { sql } from "@/lib/db"

/**
 * Admin order list, filterable by free-text query and status.
 *
 * The previous version built its WHERE clause with `sql.join(filters, sql` AND `)`.
 * That helper does not exist on the Neon HTTP driver, so this endpoint threw a
 * TypeError on every request and the admin orders screen never loaded.
 *
 * Neon's tagged template cannot compose fragments, so filtering is expressed as
 * "parameter is NULL or it matches" — one static query, still fully parameterised.
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin"])

    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get("query")?.trim()
    const rawStatus = searchParams.get("status")

    const query = rawQuery ? `%${rawQuery}%` : null
    const status = rawStatus && rawStatus !== "all" ? rawStatus : null

    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 10))
    const offset = (page - 1) * limit

    const orders = await sql`
      SELECT
        o.id,
        o.order_number,
        u.full_name  AS customer_name,
        u.email      AS customer_email,
        pp.pharmacy_name,
        o.subtotal,
        o.tax_amount,
        o.delivery_charge,
        o.total_amount,
        o.order_status,
        o.payment_status,
        o.payment_method,
        o.created_at,
        (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS item_count
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN pharmacy_profiles pp ON o.pharmacy_id = pp.id
      WHERE (${query}::text IS NULL
             OR o.order_number ILIKE ${query}
             OR u.full_name ILIKE ${query}
             OR u.email ILIKE ${query})
        AND (${status}::text IS NULL OR o.order_status = ${status})
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const totalResult = await sql`
      SELECT COUNT(*)::int AS total
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE (${query}::text IS NULL
             OR o.order_number ILIKE ${query}
             OR u.full_name ILIKE ${query}
             OR u.email ILIKE ${query})
        AND (${status}::text IS NULL OR o.order_status = ${status})
    `

    const totalOrders = Number(totalResult[0]?.total ?? 0)

    return ok({
      orders,
      totalOrders,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalOrders / limit)),
    })
  } catch (error) {
    return handleApiError(error, "admin/orders")
  }
}
