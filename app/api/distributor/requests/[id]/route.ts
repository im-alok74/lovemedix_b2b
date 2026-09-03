import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { requireApprovedDistributor } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { z } from 'zod'
import { safeParse } from '@/lib/validation'

const schema = z.object({
  status: z.enum(['IN_PROGRESS', 'FULFILLED', 'CANCELLED']),
  resolutionNote: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, distributorId } = await requireApprovedDistributor()
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')

    const req = await prisma.medicineRequest.findFirst({
      where: { id, distributorId },
      include: { pharmacy: { select: { userId: true } } },
    })
    if (!req) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const parsed = safeParse(schema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.medicineRequest.update({
        where: { id },
        data: {
          status: parsed.data.status,
          resolutionNote: parsed.data.resolutionNote || null,
          fulfilledAt: parsed.data.status === 'FULFILLED' ? new Date() : null,
        },
      })
      await tx.notification.create({
        data: {
          userId: req.pharmacy.userId,
          type: `medicine_request.${parsed.data.status.toLowerCase()}`,
          title: `Medicine request ${parsed.data.status.replace(/_/g, ' ').toLowerCase()}`,
          body: parsed.data.resolutionNote || null,
          link: '/pharmacy/requests',
        },
      })
      return row
    })

    await prisma.auditLog.create({
      data: { actorId: user.id, action: `medicine_request.${parsed.data.status.toLowerCase()}`, entityType: 'MedicineRequest', entityId: String(id) },
    })
    return ok(updated)
  } catch (error) {
    return handleApiError(error, 'distributor/requests/[id] PATCH')
  }
}
