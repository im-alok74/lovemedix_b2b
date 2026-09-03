import type { NextRequest } from 'next/server'

import { signUp } from '@/lib/auth'
import { handleApiError, badRequest, ok, tooManyRequests } from '@/lib/api-response'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import { safeParse, signUpSchema } from '@/lib/validation'

const LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(clientKey(request, 'signup'), LIMIT, WINDOW_MS)
    if (!limit.allowed) return tooManyRequests(limit.retryAfter)

    const parsed = safeParse(signUpSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')

    const { email, password, fullName, phone, userType } = parsed.data

    const user = await signUp(email, password, fullName, phone, userType, {
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    })

    return ok({ success: true, user })
  } catch (error) {
    return handleApiError(error, 'auth/signup')
  }
}
