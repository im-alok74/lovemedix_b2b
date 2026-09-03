import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, getSessionFromToken, type EdgeSession } from '@/lib/auth-edge'

type Role = EdgeSession['userType']

const ROLE_RULES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/api/admin', roles: ['ADMIN'] },
  { prefix: '/pharmacy', roles: ['PHARMACY', 'ADMIN'] },
  { prefix: '/api/pharmacy', roles: ['PHARMACY', 'ADMIN'] },
  { prefix: '/distributor', roles: ['DISTRIBUTOR', 'ADMIN'] },
  { prefix: '/api/distributor', roles: ['DISTRIBUTOR', 'ADMIN'] },
]

const AUTHENTICATED_PREFIXES = [
  '/dashboard',
  '/orders',
  '/api/orders',
  '/profile',
  '/api/procurement',
]

const PUBLIC_EXCEPTIONS = [
  '/pharmacy/register',
  '/distributor/register',
  '/api/distributor/register',
  '/api/pharmacy/register',
]

const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/admin',
  PHARMACY: '/pharmacy/dashboard',
  DISTRIBUTOR: '/distributor/dashboard',
}

function isApi(pathname: string) {
  return pathname.startsWith('/api/')
}

function matchPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (matchPrefix(pathname, '/create-admin') && process.env.NODE_ENV === 'production') {
    return NextResponse.rewrite(new URL('/404', request.url))
  }

  if (PUBLIC_EXCEPTIONS.some((p) => matchPrefix(pathname, p))) {
    return NextResponse.next()
  }

  const roleRule = ROLE_RULES.find((rule) => matchPrefix(pathname, rule.prefix))
  const needsAuthOnly = AUTHENTICATED_PREFIXES.some((p) => matchPrefix(pathname, p))

  if (!roleRule && !needsAuthOnly) {
    return NextResponse.next()
  }

  const session = await getSessionFromToken(request.cookies.get(SESSION_COOKIE)?.value)

  if (!session) {
    if (isApi(pathname)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const signInUrl = new URL('/signin', request.url)
    signInUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
    return NextResponse.redirect(signInUrl)
  }

  if (roleRule && !roleRule.roles.includes(session.userType)) {
    if (isApi(pathname)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL(ROLE_HOME[session.userType] ?? '/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|ttf|woff2?)$).*)',
  ],
}
