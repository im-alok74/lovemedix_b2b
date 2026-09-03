import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { medicineSchema, safeParse } from '@/lib/validation'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole(['ADMIN'])
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')

    const parsed = safeParse(medicineSchema.partial(), await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data

    const medicine = await prisma.medicine.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.genericName !== undefined ? { genericName: d.genericName || null } : {}),
        ...(d.manufacturer !== undefined ? { manufacturer: d.manufacturer || null } : {}),
        ...(d.categoryId !== undefined ? { categoryId: d.categoryId ?? null } : {}),
        ...(d.form !== undefined ? { form: d.form || null } : {}),
        ...(d.strength !== undefined ? { strength: d.strength || null } : {}),
        ...(d.packSize !== undefined ? { packSize: d.packSize || null } : {}),
        ...(d.hsnCode !== undefined ? { hsnCode: d.hsnCode || null } : {}),
        ...(d.mrp !== undefined ? { mrp: d.mrp } : {}),
        ...(d.gstRate !== undefined ? { gstRate: d.gstRate } : {}),
        ...(d.requiresPrescription !== undefined ? { requiresPrescription: d.requiresPrescription } : {}),
        ...(d.description !== undefined ? { description: d.description || null } : {}),
        ...(d.photoUrl !== undefined ? { photoUrl: d.photoUrl || null } : {}),
        ...(d.status !== undefined ? { status: d.status } : {}),
      },
    })
    await prisma.auditLog.create({
      data: { actorId: admin.id, action: 'medicine.update', entityType: 'Medicine', entityId: String(id) },
    })
    return ok(medicine)
  } catch (error) {
    return handleApiError(error, 'admin/medicines/[id] PATCH')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole(['ADMIN'])
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')

    const inUse = await prisma.medicine.findUnique({
      where: { id },
      select: { _count: { select: { listings: true, pharmacyInventory: true, purchaseOrderItems: true } } },
    })
    if (!inUse) return badRequest('Not found', 'NOT_FOUND')
    if (inUse._count.listings || inUse._count.pharmacyInventory || inUse._count.purchaseOrderItems) {
      // Referenced by real data — retire instead of hard delete.
      await prisma.medicine.update({ where: { id }, data: { status: 'INACTIVE' } })
      return ok({ id, retired: true })
    }
    await prisma.medicine.delete({ where: { id } })
    await prisma.auditLog.create({
      data: { actorId: admin.id, action: 'medicine.delete', entityType: 'Medicine', entityId: String(id) },
    })
    return ok({ id, deleted: true })
  } catch (error) {
    return handleApiError(error, 'admin/medicines/[id] DELETE')
  }
}
