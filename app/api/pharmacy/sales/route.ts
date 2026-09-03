import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requireApprovedPharmacy } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { safeParse, saleSchema } from '@/lib/validation'
import { SaleError, createSale } from '@/lib/sale'

export async function POST(request: NextRequest) {
  try {
    const { pharmacyId } = await requireApprovedPharmacy()
    const parsed = safeParse(saleSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data

    try {
      const sale = await createSale({
        pharmacyId,
        customerId: d.customerId ?? null,
        customerName: d.customerName || null,
        customerPhone: d.customerPhone || null,
        paymentMethod: d.paymentMethod || null,
        amountPaid: d.amountPaid,
        discountAmount: d.discountAmount,
        prescriptionRef: d.prescriptionRef || null,
        notes: d.notes || null,
        items: d.items.map((it) => ({
          inventoryId: it.inventoryId ?? null,
          medicineId: it.medicineId,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
          gstRate: it.gstRate,
          batchNumber: it.batchNumber || null,
        })),
      })
      return ok({ id: sale.id, billNumber: sale.billNumber }, 201)
    } catch (e) {
      if (e instanceof SaleError) return NextResponse.json({ success: false, error: e.message }, { status: e.status })
      throw e
    }
  } catch (error) {
    return handleApiError(error, 'pharmacy/sales POST')
  }
}
