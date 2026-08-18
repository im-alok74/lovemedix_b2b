import type { NextRequest } from "next/server"

/**
 * In-process fixed-window rate limiter.
 *
 * Honest about its limits: state lives in module memory, so each serverless instance
 * counts separately and a cold start resets the window. That is still a large
 * improvement over no limit at all — it stops naive credential stuffing and runaway
 * retry loops. Move to Redis / Upstash before you rely on this for anything that must
 * hold across the whole fleet.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Bounded so a flood of unique keys can't grow the map without limit.
const MAX_TRACKED_KEYS = 10_000

function sweep(now: number) {
  if (buckets.size < MAX_TRACKED_KEYS) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
  // Still full of live windows? Drop the oldest insertions (Map preserves order).
  if (buckets.size >= MAX_TRACKED_KEYS) {
    const excess = buckets.size - Math.floor(MAX_TRACKED_KEYS * 0.8)
    let removed = 0
    for (const key of buckets.keys()) {
      buckets.delete(key)
      if (++removed >= excess) break
    }
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** Seconds until the window resets. Send as Retry-After. */
  retryAfter: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfter: 0 }
  }

  existing.count += 1
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000)

  if (existing.count > limit) {
    return { allowed: false, remaining: 0, retryAfter }
  }

  return { allowed: true, remaining: limit - existing.count, retryAfter }
}

/**
 * Best-effort client identity. On Vercel `x-forwarded-for` is set by the platform edge
 * and cannot be spoofed by the client; behind another proxy, verify that holds before
 * trusting it.
 */
export function clientKey(request: NextRequest | Request, scope: string): string {
  const headers = request.headers
  const ip =
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  return `${scope}:${ip}`
}

/** Standard headers so clients can back off politely. */
export function rateLimitHeaders(result: RateLimitResult, limit: number): HeadersInit {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(result.remaining),
    ...(result.allowed ? {} : { "Retry-After": String(result.retryAfter) }),
  }
}
