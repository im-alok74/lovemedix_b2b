import Link from "next/link"
import { Pill } from "lucide-react"

import { Button } from "@/components/ui/button"
import SignOutButton from "@/components/auth/signout-button"
import { getCurrentUser } from "@/lib/auth"
import { SITE } from "@/lib/site"

const DASHBOARD_BY_ROLE: Record<string, string> = {
  ADMIN: "/admin",
  PHARMACY: "/pharmacy/dashboard",
  DISTRIBUTOR: "/distributor/dashboard",
}

export async function Header() {
  const user = await getCurrentUser()
  const dashboardHref = user ? DASHBOARD_BY_ROLE[user.role] ?? "/" : null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="page-container">
        <div className="flex h-16 items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${SITE.name} home`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Pill className="h-[18px] w-[18px] text-primary-foreground" aria-hidden />
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-base font-semibold tracking-tight text-foreground">{SITE.name}</span>
              <span className="mt-0.5 text-[11px] text-muted-foreground">{SITE.tagline}</span>
            </span>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-2">
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
                  <Link href="/pharmacy/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
