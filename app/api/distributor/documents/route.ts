import type { NextRequest } from 'next/server'

import { requireDistributorProfile } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { documentUploadSchema, safeParse } from '@/lib/validation'
import { addDocument } from '@/lib/documents'

export async function POST(request: NextRequest) {
  try {
    const { user, distributorId } = await requireDistributorProfile()
    const parsed = safeParse(documentUploadSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')

    const doc = await addDocument(
      { kind: 'DISTRIBUTOR', distributorProfileId: distributorId, userId: user.id },
      parsed.data,
    )
    return ok(doc, 201)
  } catch (error) {
    return handleApiError(error, 'distributor/documents POST')
  }
}
