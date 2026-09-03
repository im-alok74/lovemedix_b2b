import type React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  href?: string
}) {
  const body = (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
  return href ? (
    <Link href={href} className="block transition-colors hover:border-primary/50">
      {body}
    </Link>
  ) : (
    body
  )
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  OPEN: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  VERIFIED: 'bg-emerald-100 text-emerald-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  FULFILLED: 'bg-emerald-100 text-emerald-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  PARTIAL: 'bg-amber-100 text-amber-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-zinc-200 text-zinc-700',
  FAILED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  INACTIVE: 'bg-zinc-200 text-zinc-700',
  DRAFT: 'bg-zinc-200 text-zinc-700',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] ?? 'bg-zinc-100 text-zinc-700',
      )}
    >
      {status.replace(/_/g, ' ').toLowerCase()}
    </span>
  )
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {message ? <p className="mt-1 text-sm text-muted-foreground">{message}</p> : null}
    </div>
  )
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-border bg-card', className)}>{children}</div>
}

export function Pagination({
  basePath,
  page,
  totalPages,
  query = {},
}: {
  basePath: string
  page: number
  totalPages: number
  query?: Record<string, string | undefined>
}) {
  if (totalPages <= 1) return null
  const build = (p: number) => {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) if (v) params.set(k, v)
    params.set('page', String(p))
    return `${basePath}?${params.toString()}`
  }
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={build(page - 1)} className="rounded-md border border-border px-3 py-1.5 hover:bg-muted">
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link href={build(page + 1)} className="rounded-md border border-border px-3 py-1.5 hover:bg-muted">
            Next
          </Link>
        ) : null}
      </div>
    </div>
  )
}
