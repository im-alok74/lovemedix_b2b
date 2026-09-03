import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { z } from 'zod'
import { safeParse } from '@/lib/validation'

export async function GET() {
  try {
    const user = await requireUser()
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, type: true, title: true, body: true, link: true, readAt: true, createdAt: true },
      }),
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    ])
    return ok({ items, unread })
  } catch (error) {
    return handleApiError(error, 'notifications GET')
  }
}

const patchSchema = z.object({ id: z.coerce.number().int().positive().optional(), all: z.boolean().optional() })

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser()
    const parsed = safeParse(patchSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')

    if (parsed.data.all) {
      await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } })
    } else if (parsed.data.id) {
      await prisma.notification.updateMany({ where: { id: parsed.data.id, userId: user.id }, data: { readAt: new Date() } })
    }
    return ok({ done: true })
  } catch (error) {
    return handleApiError(error, 'notifications PATCH')
  }
}
