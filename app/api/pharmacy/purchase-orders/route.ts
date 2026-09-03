import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requireApprovedPharmacy } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { purchaseOrderSchema, safeParse } from '@/lib/validation'
import { OrderError, createPurchaseOrder } from '@/lib/purchase-order'

export async function POST(request: NextRequest) {
  try {
    const { pharmacyId } = await requireApprovedPharmacy()
    const parsed = safeParse(purchaseOrderSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data

    try {
      const order = await createPurchaseOrder({
        pharmacyId,
        distributorId: d.distributorId,
        pharmacyNote: d.pharmacyNote || null,
        expectedBy: d.expectedBy ? new Date(d.expectedBy) : null,
        items: d.items,
      })
      return ok({ id: order.id, orderNumber: order.orderNumber }, 201)
    } catch (e) {
      if (e instanceof OrderError) return NextResponse.json({ success: false, error: e.message }, { status: e.status })
      throw e
    }
  } catch (error) {
    return handleApiError(error, 'pharmacy/purchase-orders POST')
  }
}
