import type { NextRequest } from 'next/server'

type RateLimitEntry = { count: number; resetAt: number }

const store = new Map<string, RateLimitEntry>()

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (entry && now < entry.resetAt) {
    if (entry.count >= limit) {
      return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
    }
    entry.count++
    return { allowed: true, retryAfter: 0 }
  }

  store.set(key, { count: 1, resetAt: now + windowMs })
  return { allowed: true, retryAfter: 0 }
}

export function clientKey(request: NextRequest, action: string): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  return `${action}:${ip}`
}

export function cleanupStore() {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

setInterval(cleanupStore, 60_000)
