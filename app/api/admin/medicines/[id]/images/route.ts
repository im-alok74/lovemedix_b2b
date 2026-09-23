import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['ADMIN'])
    const medicineId = Number((await params).id)
    if (!Number.isInteger(medicineId)) return badRequest('Invalid medicine id')
    const body = await request.json() as { images?: { imageUrl?: string; altText?: string }[] }
    const images = body.images?.filter((image) => typeof image.imageUrl === 'string' && image.imageUrl.length <= 500) ?? []
    if (!images.length) return badRequest('At least one image is required')
    const medicine = await prisma.medicine.findUnique({ where: { id: medicineId }, select: { id: true } })
    if (!medicine) return badRequest('Medicine not found', 'NOT_FOUND')
    const last = await prisma.medicineImage.aggregate({ where: { medicineId }, _max: { sortOrder: true } })
    const created = await prisma.medicineImage.createManyAndReturn({
      data: images.map((image, index) => ({ medicineId, imageUrl: image.imageUrl!, altText: image.altText?.trim() || null, sortOrder: (last._max.sortOrder ?? -1) + index + 1 })),
    })
    return ok(created, 201)
  } catch (error) {
    return handleApiError(error, 'admin/medicines images POST')
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['ADMIN'])
    const medicineId = Number((await params).id)
    const body = await request.json() as { imageUrl?: string }
    if (!Number.isInteger(medicineId) || !body.imageUrl) return badRequest('Invalid image selection')
    await prisma.medicine.update({ where: { id: medicineId }, data: { photoUrl: body.imageUrl } })
    return ok({ medicineId, imageUrl: body.imageUrl })
  } catch (error) {
    return handleApiError(error, 'admin/medicines images PATCH')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['ADMIN'])
    const medicineId = Number((await params).id)
    const imageId = Number(new URL(request.url).searchParams.get('imageId'))
    if (!Number.isInteger(medicineId) || !Number.isInteger(imageId)) return badRequest('Invalid image')
    await prisma.medicineImage.delete({ where: { id: imageId, medicineId } })
    return ok({ imageId })
  } catch (error) {
    return handleApiError(error, 'admin/medicines images DELETE')
  }
}