import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'session_token'

export interface EdgeSession {
  userId: number
  email: string
  fullName: string
  phone: string | null
  userType: 'ADMIN' | 'PHARMACY' | 'DISTRIBUTOR'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

export async function getSessionFromToken(token?: string): Promise<EdgeSession | null> {
  if (!token) return null

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/validate-session`, {
      headers: { cookie: `session_token=${token}` },
      next: { revalidate: 0 },
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.user
  } catch {
    return null
  }
}
