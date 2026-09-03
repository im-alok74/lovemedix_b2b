import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { safeParse, settingsSchema } from '@/lib/validation'

export async function GET() {
  try {
    await requireRole(['ADMIN'])
    const settings = await prisma.platformSetting.findMany({ orderBy: { key: 'asc' } })
    return ok(settings)
  } catch (error) {
    return handleApiError(error, 'admin/settings GET')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN'])
    const parsed = safeParse(settingsSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')

    await prisma.$transaction(
      parsed.data.settings.map((s) =>
        prisma.platformSetting.upsert({
          where: { key: s.key },
          update: { value: s.value, updatedBy: admin.id },
          create: { key: s.key, value: s.value, updatedBy: admin.id },
        }),
      ),
    )
    await prisma.auditLog.create({
      data: { actorId: admin.id, action: 'settings.update', entityType: 'PlatformSetting', entityId: null },
    })
    return ok({ updated: parsed.data.settings.length })
  } catch (error) {
    return handleApiError(error, 'admin/settings PUT')
  }
}
