import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireApprovedPharmacy } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { medicineRequestSchema, safeParse } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const { user, pharmacyId } = await requireApprovedPharmacy()
    const parsed = safeParse(medicineRequestSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data

    if (d.kind === 'OUT_OF_STOCK' && !d.medicineId) return badRequest('Pick the medicine that is out of stock')
    if (d.kind === 'NEW_MEDICINE' && !d.requestedName) return badRequest('Enter the medicine name you need')

    if (d.distributorId) {
      const dist = await prisma.distributorProfile.findFirst({
        where: { id: d.distributorId, verificationStatus: 'VERIFIED' },
        select: { id: true, userId: true },
      })
      if (!dist) return badRequest('That distributor is not available')
    }

    const req = await prisma.medicineRequest.create({
      data: {
        pharmacyId,
        distributorId: d.distributorId ?? null,
        medicineId: d.medicineId ?? null,
        kind: d.kind,
        requestedName: d.requestedName || null,
        manufacturer: d.manufacturer || null,
        strength: d.strength || null,
        packSize: d.packSize || null,
        requestedQuantity: d.requestedQuantity ?? 1,
        notes: d.notes || null,
        status: 'OPEN',
      },
    })

    if (d.distributorId) {
      const dist = await prisma.distributorProfile.findUnique({ where: { id: d.distributorId }, select: { userId: true } })
      if (dist) {
        await prisma.notification.create({
          data: { userId: dist.userId, type: 'medicine_request.new', title: 'New medicine request', link: '/distributor/requests' },
        })
      }
    }
    await prisma.auditLog.create({
      data: { actorId: user.id, action: 'medicine_request.create', entityType: 'MedicineRequest', entityId: String(req.id) },
    })
    return ok(req, 201)
  } catch (error) {
    return handleApiError(error, 'pharmacy/requests POST')
  }
}
