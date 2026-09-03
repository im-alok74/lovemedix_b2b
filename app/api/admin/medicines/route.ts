import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { medicineSchema, safeParse } from '@/lib/validation'
import { medicineSlug } from '@/lib/numbering'

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN'])
    const parsed = safeParse(medicineSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data

    const medicine = await prisma.medicine.create({
      data: {
        name: d.name,
        genericName: d.genericName || null,
        manufacturer: d.manufacturer || null,
        categoryId: d.categoryId ?? null,
        form: d.form || null,
        strength: d.strength || null,
        packSize: d.packSize || null,
        hsnCode: d.hsnCode || null,
        mrp: d.mrp,
        gstRate: d.gstRate ?? 5,
        requiresPrescription: d.requiresPrescription ?? false,
        description: d.description || null,
        photoUrl: d.photoUrl || null,
        status: d.status ?? 'ACTIVE',
        slug: medicineSlug(d.name, d.strength),
      },
    })

    await prisma.auditLog.create({
      data: { actorId: admin.id, action: 'medicine.create', entityType: 'Medicine', entityId: String(medicine.id) },
    })
    return ok(medicine, 201)
  } catch (error) {
    return handleApiError(error, 'admin/medicines POST')
  }
}
