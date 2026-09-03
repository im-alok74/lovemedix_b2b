import type { NextRequest } from 'next/server'

import { signIn } from '@/lib/auth'
import { handleApiError, badRequest, ok, tooManyRequests } from '@/lib/api-response'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import { safeParse, signInSchema } from '@/lib/validation'

const LIMIT = 10
const WINDOW_MS = 5 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(clientKey(request, 'signin'), LIMIT, WINDOW_MS)
    if (!limit.allowed) return tooManyRequests(limit.retryAfter)

    const parsed = safeParse(signInSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')

    const user = await signIn(parsed.data.email, parsed.data.password, {
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    })

    return ok({ success: true, user })
  } catch (error) {
    return handleApiError(error, 'auth/signin')
  }
}
