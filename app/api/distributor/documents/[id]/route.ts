import type { NextRequest } from 'next/server'

import { requireDistributorProfile } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { NextResponse } from 'next/server'
import { deleteDocument } from '@/lib/documents'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireDistributorProfile()
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')

    const result = await deleteDocument(id, user.id)
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status })
    return ok({ id, deleted: true })
  } catch (error) {
    return handleApiError(error, 'distributor/documents/[id] DELETE')
  }
}
