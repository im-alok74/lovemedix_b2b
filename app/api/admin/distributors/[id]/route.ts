import type { NextRequest } from 'next/server'

import { requireRole } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { safeParse, verificationActionSchema } from '@/lib/validation'
import { setProfileVerification } from '@/lib/admin-actions'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole(['ADMIN'])
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')

    const parsed = safeParse(verificationActionSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')

    await setProfileVerification('distributor', id, parsed.data.action, admin.id, parsed.data.reason)
    return ok({ id, action: parsed.data.action })
  } catch (error) {
    return handleApiError(error, 'admin/distributors/[id]')
  }
}
