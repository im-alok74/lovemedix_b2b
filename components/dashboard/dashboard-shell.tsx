import type React from 'react'
import Link from 'next/link'

import SignOutButton from '@/components/auth/signout-button'
import { NotificationsBell } from '@/components/dashboard/notifications-bell'
import { DashboardSidebar, DashboardMobileNav } from '@/components/dashboard/dashboard-nav'
import { LogoMark } from '@/components/brand/logo'
import type { NavItem } from '@/lib/dashboard-nav'

export type { NavItem }

/**
 * Shared frame for the admin / pharmacy / distributor consoles. Server component;
 * the parent layout resolves the session and role before rendering it.
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
      <DashboardSidebar workspace={workspace} items={nav} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <DashboardMobileNav workspace={workspace} items={nav} />
            <div className="flex items-center gap-2 lg:hidden">
              <LogoMark className="h-7 w-7" />
              <span className="text-sm font-semibold">{workspace}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationsBell />
            <div className="hidden items-center gap-2 border-l border-border pl-3 sm:flex">
              <div className="text-right leading-tight">
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
              <SignOutButton />
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-muted/20 px-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 to-transparent" />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <LogoMark className="mx-auto h-12 w-12" />
        <h1 className="mt-5 text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          {action ? (
            <Link
              href={action.href}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto"
            >
              {action.label}
            </Link>
          ) : null}
          <span className="inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted sm:w-auto">
            <SignOutButton />
          </span>
        </div>
      </div>
    </div>
  )
}
