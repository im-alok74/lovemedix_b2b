import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { requireApprovedPharmacy } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { pharmacyId } = await requireApprovedPharmacy()
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')

    const req = await prisma.medicineRequest.findFirst({ where: { id, pharmacyId }, select: { status: true } })
    if (!req) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    if (!['OPEN', 'IN_PROGRESS'].includes(req.status)) return badRequest('This request can no longer be cancelled')

    const updated = await prisma.medicineRequest.update({ where: { id }, data: { status: 'CANCELLED' } })
    return ok(updated)
  } catch (error) {
    return handleApiError(error, 'pharmacy/requests/[id] PATCH')
  }
}
