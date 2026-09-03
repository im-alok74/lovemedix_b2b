import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Edge middleware does a cheap first pass only: is there a session cookie at all on a
 * protected path? Role and approval checks need the database and run in the route-group
 * layouts (`app/(admin|pharmacy|distributor)/layout.tsx`) and API handlers, which have
 * Prisma. This keeps the edge fast and the authorization logic in one place per role.
 */

const SESSION_COOKIE = 'session_token'

const PROTECTED_PREFIXES = ['/admin', '/pharmacy', '/distributor', '/api/admin', '/api/pharmacy', '/api/distributor']

// Reachable without a session even though they sit under a protected prefix.
const PUBLIC_EXCEPTIONS = [
  '/pharmacy/register',
  '/distributor/register',
  '/api/pharmacy/register',
  '/api/distributor/register',
]

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (PUBLIC_EXCEPTIONS.some((p) => matches(pathname, p))) return NextResponse.next()
  if (!PROTECTED_PREFIXES.some((p) => matches(pathname, p))) return NextResponse.next()

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value)
  if (hasSession) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const signInUrl = new URL('/signin', request.url)
  signInUrl.searchParams.set('redirect', pathname + search)
  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|ttf|woff2?)$).*)',
  ],
}
