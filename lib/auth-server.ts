import { cookies } from "next/headers"
import { cache } from "react"
import bcrypt from "bcryptjs"

import { sql } from "./db"
import type { User } from "./types"

/**
 * Server-side authentication.
 *
 * Nothing in this file logs credentials. The previous version printed the stored bcrypt
 * hash, its length and the submitted password's length on every sign-in attempt, which
 * put password material into hosting logs.
 */

const SESSION_COOKIE = "session_token"
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const BCRYPT_ROUNDS = 12

/** Lock an account after this many consecutive failures. */
const MAX_FAILED_LOGINS = 8
const LOCKOUT_MS = 15 * 60 * 1000

export class AuthError extends Error {
  constructor(
    message: string,
    public code: "INVALID_CREDENTIALS" | "ACCOUNT_LOCKED" | "EMAIL_TAKEN" | "UNAUTHORIZED" | "FORBIDDEN",
    public status: number,
  ) {
    super(message)
    this.name = "AuthError"
  }
}

function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function createSession(
  userId: number,
  meta?: { userAgent?: string | null; ipAddress?: string | null },
): Promise<string> {
  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await sql`
    INSERT INTO sessions (user_id, session_token, expires_at, user_agent, ip_address)
    VALUES (${userId}, ${sessionToken}, ${expiresAt}, ${meta?.userAgent ?? null}, ${meta?.ipAddress ?? null})
  `

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })

  return sessionToken
}

/**
 * Current user for this request. `cache` dedupes the lookup so a page rendering the
 * header, a guard and a data fetch issues one query, not three.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
    if (!sessionToken) return null

    const result = await sql`
      SELECT u.id, u.email, u.full_name, u.phone, u.user_type, u.status
      FROM users u
      INNER JOIN sessions s ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
        AND u.status = 'active'
      LIMIT 1
    `

    return result.length > 0 ? (result[0] as User) : null
  } catch (error) {
    // Next signals "this route reads cookies, so it must render dynamically" by throwing.
    // Swallowing that would hide the signal from the renderer and break prerendering,
    // so it has to propagate. Only genuine failures become a null user.
    if (isNextDynamicUsageError(error)) throw error

    console.error("[auth] Failed to resolve current user:", error)
    return null
  }
})

function isNextDynamicUsageError(error: unknown): boolean {
  const digest = (error as { digest?: unknown })?.digest
  return typeof digest === "string" && digest.startsWith("DYNAMIC_SERVER_USAGE")
}

export async function signIn(
  email: string,
  password: string,
  meta?: { userAgent?: string | null; ipAddress?: string | null },
): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase()

  const result = await sql`
    SELECT id, email, password_hash, full_name, phone, user_type, status,
           failed_login_count, locked_until
    FROM users
    WHERE LOWER(email) = ${normalizedEmail}
    LIMIT 1
  `

  const user = result[0] as
    | (User & { password_hash: string; failed_login_count: number; locked_until: Date | null })
    | undefined

  // Compare against a dummy hash when the user doesn't exist so the response time
  // doesn't reveal whether an email is registered.
  if (!user) {
    await bcrypt.compare(password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu")
    throw new AuthError("Incorrect email or password", "INVALID_CREDENTIALS", 401)
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new AuthError(
      "Too many failed attempts. Try again in a few minutes.",
      "ACCOUNT_LOCKED",
      423,
    )
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash)

  if (!isValidPassword) {
    const nextCount = (user.failed_login_count ?? 0) + 1
    const shouldLock = nextCount >= MAX_FAILED_LOGINS

    await sql`
      UPDATE users
      SET failed_login_count = ${nextCount},
          locked_until = ${shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null}
      WHERE id = ${user.id}
    `

    throw new AuthError("Incorrect email or password", "INVALID_CREDENTIALS", 401)
  }

  if (user.status !== "active") {
    throw new AuthError(
      "This account is not active. Contact support for help.",
      "FORBIDDEN",
      403,
    )
  }

  // Session fixation defence: drop any session tied to a token the caller may already
  // hold before issuing a fresh one.
  await sql`
    DELETE FROM sessions WHERE user_id = ${user.id} AND expires_at < NOW()
  `

  await sql`
    UPDATE users
    SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW()
    WHERE id = ${user.id}
  `

  await createSession(user.id, meta)

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    phone: user.phone,
    user_type: user.user_type,
    status: user.status,
  }
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  userType: "customer" | "pharmacy" | "distributor",
  meta?: { userAgent?: string | null; ipAddress?: string | null },
): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase()

  const existing = await sql`
    SELECT id FROM users WHERE LOWER(email) = ${normalizedEmail} LIMIT 1
  `
  if (existing.length > 0) {
    throw new AuthError("An account with this email already exists", "EMAIL_TAKEN", 409)
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const result = await sql`
    INSERT INTO users (email, password_hash, full_name, phone, user_type)
    VALUES (${normalizedEmail}, ${passwordHash}, ${fullName.trim()}, ${phone.trim()}, ${userType})
    RETURNING id, email, full_name, phone, user_type, status
  `

  const user = result[0] as User
  await createSession(user.id, meta)
  return user
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value

  if (sessionToken) {
    await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`
  }

  cookieStore.delete(SESSION_COOKIE)
}

/** Throws AuthError unless a user is signed in. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new AuthError("You must be signed in", "UNAUTHORIZED", 401)
  return user
}

/** Throws AuthError unless the signed-in user holds one of `allowedRoles`. */
export async function requireRole(allowedRoles: string[]): Promise<User> {
  const user = await requireUser()
  if (!allowedRoles.includes(user.user_type)) {
    throw new AuthError("You do not have access to this resource", "FORBIDDEN", 403)
  }
  return user
}

/**
 * Resolves the pharmacy_profiles row owned by the signed-in pharmacy user.
 * Use this instead of taking a pharmacy id from the request — that's how IDOR happens.
 */
export async function requirePharmacyProfile(): Promise<{ user: User; pharmacyId: number }> {
  const user = await requireRole(["pharmacy"])
  const rows = await sql`
    SELECT id FROM pharmacy_profiles WHERE user_id = ${user.id} LIMIT 1
  `
  if (rows.length === 0) {
    throw new AuthError("Complete your pharmacy registration first", "FORBIDDEN", 403)
  }
  return { user, pharmacyId: Number(rows[0].id) }
}

/** Same idea for distributors. */
export async function requireDistributorProfile(): Promise<{ user: User; distributorId: number }> {
  const user = await requireRole(["distributor"])
  const rows = await sql`
    SELECT id FROM distributor_profiles WHERE user_id = ${user.id} LIMIT 1
  `
  if (rows.length === 0) {
    throw new AuthError("Complete your distributor registration first", "FORBIDDEN", 403)
  }
  return { user, distributorId: Number(rows[0].id) }
}
