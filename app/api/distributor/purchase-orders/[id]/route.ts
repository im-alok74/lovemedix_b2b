import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { requireApprovedDistributor } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { purchaseOrderStatusSchema, safeParse } from '@/lib/validation'
import { OrderError, transitionPurchaseOrder } from '@/lib/purchase-order'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, distributorId } = await requireApprovedDistributor()
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')

    const order = await prisma.purchaseOrder.findFirst({ where: { id, distributorId }, select: { id: true } })
    if (!order) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const parsed = safeParse(purchaseOrderStatusSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')

    try {
      const updated = await transitionPurchaseOrder(id, parsed.data.status, { userId: user.id, role: 'DISTRIBUTOR' }, parsed.data.note)
      return ok(updated)
    } catch (e) {
      if (e instanceof OrderError) return NextResponse.json({ success: false, error: e.message }, { status: e.status })
      throw e
    }
  } catch (error) {
    return handleApiError(error, 'distributor/purchase-orders/[id] PATCH')
  }
}
