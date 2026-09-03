import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { badRequest, forbidden, handleApiError, ok } from '@/lib/api-response'
import { safeParse, userUpdateSchema } from '@/lib/validation'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole(['ADMIN'])
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')
    if (id === admin.id) return forbidden('You cannot modify your own account here')

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } })
    if (!target) return badRequest('Not found', 'NOT_FOUND')
    if (target.role === 'ADMIN') return forbidden('Admin accounts are managed separately')

    const parsed = safeParse(userUpdateSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(d.status !== undefined ? { status: d.status } : {}),
        ...(d.fullName !== undefined ? { fullName: d.fullName } : {}),
        ...(d.phone !== undefined ? { phone: d.phone } : {}),
      },
      select: { id: true, email: true, fullName: true, phone: true, role: true, status: true },
    })
    if (d.status && d.status !== 'ACTIVE') {
      await prisma.session.deleteMany({ where: { userId: id } })
    }
    await prisma.auditLog.create({
      data: { actorId: admin.id, action: 'user.update', entityType: 'User', entityId: String(id), metadata: d },
    })
    return ok(user)
  } catch (error) {
    return handleApiError(error, 'admin/users/[id] PATCH')
  }
}
