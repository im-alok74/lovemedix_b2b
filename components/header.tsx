import Link from 'next/link'

import { Button } from '@/components/ui/button'
import SignOutButton from '@/components/auth/signout-button'
import { getCurrentUser } from '@/lib/auth'
import { Logo } from '@/components/brand/logo'

const DASHBOARD_BY_ROLE: Record<string, string> = {
  ADMIN: '/admin',
  PHARMACY: '/pharmacy/dashboard',
  DISTRIBUTOR: '/distributor/dashboard',
}

export async function Header() {
  const user = await getCurrentUser()
  const dashboardHref = user ? DASHBOARD_BY_ROLE[user.role] ?? '/' : null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between gap-3">
          <Logo href="/" subtitle="B2B marketplace" />

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="/#how" className="hover:text-foreground">How it works</a>
            <a href="/#pharmacies" className="hover:text-foreground">For pharmacies</a>
            <a href="/#distributors" className="hover:text-foreground">For distributors</a>
            <a href="/#compliance" className="hover:text-foreground">Compliance</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {user && dashboardHref ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={dashboardHref}>Dashboard</Link>
                </Button>
                <span className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
                  <SignOutButton />
                </span>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/signin">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/get-started">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
