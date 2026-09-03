import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { cache } from 'react'

import prisma from '@/lib/prisma'
import type { UserRole, UserStatus } from '@/lib/types'

const SESSION_COOKIE = 'session_token'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const BCRYPT_ROUNDS = 12
const MAX_FAILED_LOGINS = 8
const LOCKOUT_MS = 15 * 60 * 1000

export class AuthError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'EMAIL_TAKEN' | 'UNAUTHORIZED' | 'FORBIDDEN',
    public status: number,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function createSession(
  userId: number,
  meta?: { userAgent?: string | null; ipAddress?: string | null },
): Promise<string> {
  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await prisma.session.create({
    data: {
      userId,
      token: sessionToken,
      expiresAt,
      userAgent: meta?.userAgent ?? null,
      ipAddress: meta?.ipAddress ?? null,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })

  return sessionToken
}

export const getCurrentUser = cache(async () => {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
    if (!sessionToken) return null

    const session = await prisma.session.findFirst({
      where: {
        token: sessionToken,
        expiresAt: { gt: new Date() },
        user: { status: 'ACTIVE' },
      },
      include: { user: true },
    })

    if (!session) return null

    return {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      phone: session.user.phone,
      role: session.user.role as UserRole,
      status: session.user.status as UserStatus,
    }
  } catch (error) {
    if (isNextDynamicUsageError(error)) throw error
    console.error('[auth] Failed to resolve current user:', error)
    return null
  }
})

function isNextDynamicUsageError(error: unknown): boolean {
  const digest = (error as { digest?: unknown })?.digest
  return typeof digest === 'string' && digest.startsWith('DYNAMIC_SERVER_USAGE')
}

export async function signIn(
  email: string,
  password: string,
  meta?: { userAgent?: string | null; ipAddress?: string | null },
) {
  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (!user) {
    await bcrypt.compare(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu')
    throw new AuthError('Incorrect email or password', 'INVALID_CREDENTIALS', 401)
  }

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    throw new AuthError('Too many failed attempts. Try again in a few minutes.', 'ACCOUNT_LOCKED', 423)
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash)

  if (!isValidPassword) {
    const nextCount = (user.failedLogins ?? 0) + 1
    const shouldLock = nextCount >= MAX_FAILED_LOGINS

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: nextCount,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null,
      },
    })

    throw new AuthError('Incorrect email or password', 'INVALID_CREDENTIALS', 401)
  }

  if (user.status !== 'ACTIVE') {
    throw new AuthError('This account is not active. Contact support for help.', 'FORBIDDEN', 403)
  }

  await prisma.session.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  })

  await createSession(user.id, meta)

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role as UserRole,
    status: user.status as UserStatus,
  }
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  role: UserRole,
  meta?: { userAgent?: string | null; ipAddress?: string | null },
) {
  const normalizedEmail = email.trim().toLowerCase()

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (existing) {
    throw new AuthError('An account with this email already exists', 'EMAIL_TAKEN', 409)
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      fullName: fullName.trim(),
      phone: phone.trim(),
      role,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      status: true,
    },
  })

  await createSession(user.id, meta)

  return user
}

export async function signOut() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value

  if (sessionToken) {
    await prisma.session.deleteMany({ where: { token: sessionToken } })
  }

  cookieStore.delete(SESSION_COOKIE)
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new AuthError('You must be signed in', 'UNAUTHORIZED', 401)
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireUser()
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError('You do not have access to this resource', 'FORBIDDEN', 403)
  }
  return user
}

export async function requirePharmacyProfile() {
  const user = await requireRole(['PHARMACY'])
  const profile = await prisma.pharmacyProfile.findUnique({
    where: { userId: user.id },
  })
  if (!profile) {
    throw new AuthError('Complete your pharmacy registration first', 'FORBIDDEN', 403)
  }
  return { user, pharmacyId: profile.id }
}

export async function requireDistributorProfile() {
  const user = await requireRole(['DISTRIBUTOR'])
  const profile = await prisma.distributorProfile.findUnique({
    where: { userId: user.id },
  })
  if (!profile) {
    throw new AuthError('Complete your distributor registration first', 'FORBIDDEN', 403)
  }
  return { user, distributorId: profile.id }
}
