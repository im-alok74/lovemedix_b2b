import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.user_type !== "pharmacy") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"

    const pharmacyRows = await sql`
      SELECT id FROM pharmacy_profiles WHERE user_id = ${user.id} LIMIT 1
    `
    if (!pharmacyRows.length) {
      return NextResponse.json({ error: "Pharmacy profile not found" }, { status: 404 })
    }

    const pharmacyId = (pharmacyRows[0] as any).id

    let orders

    try {
      // Legacy addresses schema: street_address/landmark
      if (filter === "all") {
        orders = await sql`
          SELECT 
            o.id, o.order_number, o.order_status, o.payment_status,
            o.total_amount, o.created_at,
            u.full_name as customer_name,
            TRIM(CONCAT(COALESCE(a.street_address, ''), ', ', COALESCE(a.city, ''))) as delivery_address
          FROM orders o
          JOIN users u ON o.customer_id = u.id
          LEFT JOIN addresses a ON o.delivery_address_id = a.id
          WHERE o.pharmacy_id = ${pharmacyId}
          ORDER BY o.created_at DESC
        `
      } else {
        orders = await sql`
          SELECT 
            o.id, o.order_number, o.order_status, o.payment_status,
            o.total_amount, o.created_at,
            u.full_name as customer_name,
            TRIM(CONCAT(COALESCE(a.street_address, ''), ', ', COALESCE(a.city, ''))) as delivery_address
          FROM orders o
          JOIN users u ON o.customer_id = u.id
          LEFT JOIN addresses a ON o.delivery_address_id = a.id
          WHERE o.pharmacy_id = ${pharmacyId} AND o.order_status = ${filter}
          ORDER BY o.created_at DESC
        `
      }
    } catch {
      // Newer addresses schema: address_line1/address_line2
      if (filter === "all") {
        orders = await sql`
          SELECT 
            o.id, o.order_number, o.order_status, o.payment_status,
            o.total_amount, o.created_at,
            u.full_name as customer_name,
            TRIM(CONCAT(COALESCE(a.address_line1, ''), ', ', COALESCE(a.city, ''))) as delivery_address
          FROM orders o
          JOIN users u ON o.customer_id = u.id
          LEFT JOIN addresses a ON o.delivery_address_id = a.id
          WHERE o.pharmacy_id = ${pharmacyId}
          ORDER BY o.created_at DESC
        `
      } else {
        orders = await sql`
          SELECT 
            o.id, o.order_number, o.order_status, o.payment_status,
            o.total_amount, o.created_at,
            u.full_name as customer_name,
            TRIM(CONCAT(COALESCE(a.address_line1, ''), ', ', COALESCE(a.city, ''))) as delivery_address
          FROM orders o
          JOIN users u ON o.customer_id = u.id
          LEFT JOIN addresses a ON o.delivery_address_id = a.id
          WHERE o.pharmacy_id = ${pharmacyId} AND o.order_status = ${filter}
          ORDER BY o.created_at DESC
        `
      }
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("[v0] Get pharmacy orders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
