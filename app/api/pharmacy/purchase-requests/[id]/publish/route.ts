import { NextRequest, NextResponse } from 'next/server'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const id = Number((await params).id)
    if (Number.isNaN(id)) {
      return badRequest('Invalid request id')
    }

    const prRows = await sql`
      SELECT * FROM purchase_requests WHERE id = ${id}
    `
    if (!prRows.length) {
      return notFound('Purchase request not found')
    }
    const pr = prRows[0] as any

    if (Number(pr.pharmacy_id) !== Number(pharmacyId)) {
      return forbidden('Forbidden')
    }

    if (pr.status !== 'PAID') {
      return badRequest('Only PAID requests can be published to store')
    }

    const body = await request.json().catch(() => ({}))
    const pricingMode = String((body as any).pricingMode || 'mrp') as 'mrp' | 'mrp_discount' | 'custom'
    const discountPercentageRaw = Number((body as any).discountPercentage ?? 0)
    const discountPercentage = Number.isFinite(discountPercentageRaw) ? Math.max(0, Math.min(100, discountPercentageRaw)) : 0
    const customSellingPriceRaw = Number((body as any).customSellingPrice)
    const customSellingPrice = Number.isFinite(customSellingPriceRaw) ? customSellingPriceRaw : null

    const items = await sql`
      SELECT pi.*, m.mrp
      FROM purchase_items pi
      JOIN medicines m ON m.id = pi.medicine_id
      WHERE pi.request_id = ${id}
    `

    for (const item of items as any[]) {
      const mrp = Number(item.mrp || 0)
      let sellingPrice = Number(item.price || 0)
      let discountToStore = 0

      if (pricingMode === 'mrp') {
        sellingPrice = mrp
        discountToStore = 0
      } else if (pricingMode === 'mrp_discount') {
        sellingPrice = mrp
        discountToStore = discountPercentage
      } else if (pricingMode === 'custom' && customSellingPrice !== null) {
        sellingPrice = customSellingPrice
        discountToStore = 0
      }

      await sql`
        INSERT INTO pharmacy_inventory (
          pharmacy_id, medicine_id, stock_quantity, selling_price, discount_percent, batch_number, expiry_date
        )
        VALUES (
          ${pharmacyId}, ${item.medicine_id}, ${item.quantity}, ${sellingPrice}, ${discountToStore},
          ${item.batch_number || null}, ${item.expiry_date || null}
        )
        ON CONFLICT (pharmacy_id, medicine_id, batch_number)
        DO UPDATE SET
          stock_quantity = pharmacy_inventory.stock_quantity + EXCLUDED.stock_quantity,
          selling_price = EXCLUDED.selling_price,
          discount_percent = EXCLUDED.discount_percent,
          expiry_date = COALESCE(EXCLUDED.expiry_date, pharmacy_inventory.expiry_date),
          updated_at = NOW()
      `
    }
    await sql`
      UPDATE purchase_requests
      SET updated_at = NOW()
      WHERE id = ${id}
    `

    revalidatePath('/pharmacy/purchase-requests')
    return ok({ success: true })
  } catch (error) {
    return handleApiError(error, 'PHARMACY PURCHASE REQUEST PUBLISH')
  }
}
