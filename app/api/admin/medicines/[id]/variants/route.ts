import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['ADMIN'])
    const medicineId = Number((await params).id)
    const body = await request.json() as { size?: string; sku?: string }
    const size = body.size?.trim()
    if (!Number.isInteger(medicineId) || !size || size.length > 100) return badRequest('A variant size is required')
    const variant = await prisma.medicineVariant.upsert({
      where: { medicineId_size: { medicineId, size } },
      create: { medicineId, size, sku: body.sku?.trim() || null },
      update: { sku: body.sku?.trim() || null, isActive: true },
    })
    return ok(variant, 201)
  } catch (error) {
    return handleApiError(error, 'admin/medicine variants POST')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['ADMIN'])
    const medicineId = Number((await params).id)
    const variantId = Number(new URL(request.url).searchParams.get('variantId'))
    if (!Number.isInteger(medicineId) || !Number.isInteger(variantId)) return badRequest('Invalid variant')
    const variant = await prisma.medicineVariant.findFirst({ where: { id: variantId, medicineId }, select: { id: true, _count: { select: { listings: true } } } })
    if (!variant) return badRequest('Variant not found', 'NOT_FOUND')
    if (variant._count.listings) await prisma.medicineVariant.update({ where: { id: variantId }, data: { isActive: false } })
    else await prisma.medicineVariant.delete({ where: { id: variantId } })
    return ok({ id: variantId })
  } catch (error) {
    return handleApiError(error, 'admin/medicine variants DELETE')
  }
}