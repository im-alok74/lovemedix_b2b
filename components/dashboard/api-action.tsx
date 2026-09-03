'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export interface ApiActionProps {
  endpoint: string
  method?: 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: Record<string, unknown>
  label: string
  pendingLabel?: string
  confirm?: string
  /** When set, prompt the user for a reason and merge it into the body as this key. */
  promptReason?: string
  variant?: 'primary' | 'secondary' | 'danger'
  redirectTo?: string
  className?: string
}

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'border border-border hover:bg-muted',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

export function ApiAction({
  endpoint,
  method = 'PATCH',
  body,
  label,
  pendingLabel = 'Working…',
  confirm,
  promptReason,
  variant = 'secondary',
  redirectTo,
  className,
}: ApiActionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)

  async function run() {
    if (confirm && !window.confirm(confirm)) return
    let payload = { ...(body ?? {}) }
    if (promptReason) {
      const reason = window.prompt(`${label} — add a reason (optional):`) ?? ''
      payload = { ...payload, [promptReason]: reason || null }
    }
    setBusy(true)
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'DELETE' && !Object.keys(payload).length ? undefined : JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Action failed', description: data?.error ?? `HTTP ${res.status}`, variant: 'destructive' })
        return
      }
      toast({ title: 'Done', description: label })
      if (redirectTo) router.push(redirectTo)
      else startTransition(() => router.refresh())
    } catch (error) {
      toast({ title: 'Network error', description: String(error), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy || isPending}
      className={cn(
        'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60',
        VARIANTS[variant],
        className,
      )}
    >
      {busy || isPending ? pendingLabel : label}
    </button>
  )
}
