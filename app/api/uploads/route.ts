import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requireUser } from '@/lib/auth'
import { handleApiError, ok } from '@/lib/api-response'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import { cloudinaryReady, uploadDocument } from '@/lib/uploads'

export const runtime = 'nodejs'

/**
 * Authenticated file upload for verification documents. Uses Cloudinary when the
 * CLOUDINARY_* env vars are set; otherwise returns 501 and the UI falls back to
 * pasting a shareable link.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const limit = rateLimit(clientKey(request, 'upload'), 30, 60 * 60 * 1000)
    if (!limit.allowed) return NextResponse.json({ success: false, error: 'Too many uploads' }, { status: 429 })

    if (!cloudinaryReady()) {
      return NextResponse.json(
        { success: false, error: 'Direct upload is not configured. Paste a shareable link instead.' },
        { status: 501 },
      )
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })

    const folder =
      user.role === 'DISTRIBUTOR' || user.role === 'PHARMACY' ? 'CLOUDINARY_DOCUMENTS_FOLDER' : 'CLOUDINARY_DOCUMENTS_FOLDER'

    try {
      const result = await uploadDocument(file, folder)
      return ok({ fileUrl: result.url, fileName: result.originalName, fileSize: result.bytes, mimeType: file.type || null })
    } catch (e) {
      return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Upload failed' }, { status: 400 })
    }
  } catch (error) {
    return handleApiError(error, 'uploads POST')
  }
}
