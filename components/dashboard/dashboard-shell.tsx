import type React from 'react'
import Link from 'next/link'
import { Pill } from 'lucide-react'

import { SITE } from '@/lib/site'
import SignOutButton from '@/components/auth/signout-button'
import { NotificationsBell } from '@/components/dashboard/notifications-bell'

export interface NavItem {
  href: string
  label: string
}

/**
 * Shared frame for the admin / pharmacy / distributor consoles. Server component:
 * the parent layout has already resolved the session and role before rendering this.
 */
export function DashboardShell({
  workspace,
  nav,
  user,
  children,
}: {
  workspace: string
  nav: NavItem[]
  user: { fullName: string; email: string }
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Pill className="h-[18px] w-[18px] text-primary-foreground" aria-hidden />
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold">{SITE.name}</span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">{workspace}</span>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <p className="truncate text-sm font-medium">{user.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Pill className="h-4 w-4 text-primary-foreground" aria-hidden />
            </span>
            <span className="text-sm font-semibold">{workspace}</span>
          </div>
          <div className="hidden text-sm font-medium text-muted-foreground lg:block">{workspace}</div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <span className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
              <SignOutButton />
            </span>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

/** Approval-status / finish-registration screen shown instead of the console. */
export function DashboardGateScreen({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Pill className="h-6 w-6 text-primary" aria-hidden />
        </span>
        <h1 className="mt-4 text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          {action ? (
            <Link
              href={action.href}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {action.label}
            </Link>
          ) : null}
          <span className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <SignOutButton />
          </span>
        </div>
      </div>
    </div>
  )
}
