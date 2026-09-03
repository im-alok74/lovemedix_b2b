import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { requireApprovedPharmacy } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { z } from 'zod'
import { safeParse } from '@/lib/validation'
import { OrderError, transitionPurchaseOrder } from '@/lib/purchase-order'

const schema = z.union([
  z.object({ status: z.literal('CANCELLED'), note: z.string().trim().max(1000).optional().nullable() }),
  z.object({ markPaid: z.literal(true), paymentMethod: z.string().trim().max(50).optional(), transactionRef: z.string().trim().max(255).optional() }),
])

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, pharmacyId } = await requireApprovedPharmacy()
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')

    const order = await prisma.purchaseOrder.findFirst({ where: { id, pharmacyId }, select: { id: true, status: true } })
    if (!order) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const parsed = safeParse(schema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')

    const payload = parsed.data
    if (!('markPaid' in payload)) {
      try {
        const updated = await transitionPurchaseOrder(id, 'CANCELLED', { userId: user.id, role: 'PHARMACY' }, payload.note)
        return ok(updated)
      } catch (e) {
        if (e instanceof OrderError) return NextResponse.json({ success: false, error: e.message }, { status: e.status })
        throw e
      }
    }

    // markPaid: pharmacy self-reports payment; distributor still reconciles.
    const updated = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.update({
        where: { id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: payload.paymentMethod ?? null,
          transactionRef: payload.transactionRef ?? null,
          events: { create: { status: 'PAYMENT_MARKED', note: 'Pharmacy marked as paid', actorId: user.id } },
        },
      })
      await tx.invoice.updateMany({ where: { orderId: id }, data: { paymentStatus: 'PAID', paidAt: new Date() } })
      return po
    })
    return ok(updated)
  } catch (error) {
    return handleApiError(error, 'pharmacy/purchase-orders/[id] PATCH')
  }
}
