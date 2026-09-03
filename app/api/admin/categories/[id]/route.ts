import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { categorySchema, safeParse } from '@/lib/validation'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['ADMIN'])
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')

    const parsed = safeParse(categorySchema.partial(), await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.description !== undefined ? { description: d.description || null } : {}),
        ...(d.displayOrder !== undefined ? { displayOrder: d.displayOrder } : {}),
        ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
      },
    })
    return ok(category)
  } catch (error) {
    return handleApiError(error, 'admin/categories/[id] PATCH')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['ADMIN'])
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')

    const count = await prisma.medicine.count({ where: { categoryId: id } })
    if (count > 0) {
      await prisma.category.update({ where: { id }, data: { isActive: false } })
      return ok({ id, deactivated: true })
    }
    await prisma.category.delete({ where: { id } })
    return ok({ id, deleted: true })
  } catch (error) {
    return handleApiError(error, 'admin/categories/[id] DELETE')
  }
}
