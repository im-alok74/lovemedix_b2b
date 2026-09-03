import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { AuthError } from '@/lib/auth'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function badRequest(error: string, code = 'BAD_REQUEST') {
  return NextResponse.json({ success: false, error, code }, { status: 400 })
}

export function unauthorized(error = 'Unauthorized') {
  return NextResponse.json({ success: false, error }, { status: 401 })
}

export function forbidden(error = 'Forbidden') {
  return NextResponse.json({ success: false, error }, { status: 403 })
}

export function notFound(error = 'Not found') {
  return NextResponse.json({ success: false, error }, { status: 404 })
}

export function conflict(error: string) {
  return NextResponse.json({ success: false, error }, { status: 409 })
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { success: false, error: 'Too many requests', retryAfter },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    },
  )
}

export function serverError(error: string) {
  return NextResponse.json({ success: false, error }, { status: 500 })
}

export function handleApiError(error: unknown, context = ''): NextResponse {
  console.error(`[${context}]`, error)

  if (error instanceof AuthError) {
    if (error.code === 'INVALID_CREDENTIALS') return unauthorized(error.message)
    if (error.code === 'ACCOUNT_LOCKED') return NextResponse.json({ success: false, error: error.message }, { status: 423 })
    if (error.code === 'EMAIL_TAKEN') return conflict(error.message)
    if (error.code === 'UNAUTHORIZED') return unauthorized(error.message)
    if (error.code === 'FORBIDDEN') return forbidden(error.message)
  }

  if (error instanceof z.ZodError) {
    return badRequest(error.issues[0]?.message ?? 'Invalid input', 'VALIDATION_ERROR')
  }

  return serverError('Internal server error')
}
