import { NextResponse } from "next/server"
import { z } from "zod"

import { AuthError } from "./auth-server"

/**
 * One error shape for every API route: `{ error: string, code?: string }`.
 *
 * Route handlers should end with `catch (error) { return handleApiError(error, scope) }`
 * so auth failures return 401/403 instead of being swallowed into a generic 500, and so
 * internal messages never leak to the client.
 */

export function handleApiError(error: unknown, scope: string): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: error.issues[0]?.message ?? "Invalid input",
        code: "VALIDATION_ERROR",
        issues: error.issues,
      },
      { status: 400 },
    )
  }

  // Postgres unique-violation surfaces as a duplicate-key message.
  if (error instanceof Error && /duplicate key|unique constraint/i.test(error.message)) {
    return NextResponse.json(
      { error: "That record already exists", code: "DUPLICATE" },
      { status: 409 },
    )
  }

  // Log the real error server-side; return something safe to the client. Stack traces
  // and SQL text must never reach the browser.
  console.error(`[${scope}]`, error)

  return NextResponse.json(
    { error: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
    { status: 500 },
  )
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function badRequest(message: string, code = "BAD_REQUEST") {
  return NextResponse.json({ error: message, code }, { status: 400 })
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message, code: "NOT_FOUND" }, { status: 404 })
}

export function forbidden(message = "You do not have access to this resource") {
  return NextResponse.json({ error: message, code: "FORBIDDEN" }, { status: 403 })
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests. Please slow down.", code: "RATE_LIMITED" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  )
}
