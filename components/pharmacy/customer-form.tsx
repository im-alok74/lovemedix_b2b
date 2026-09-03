'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export interface CustomerInitial {
  id?: number
  name?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export function CustomerForm({ initial }: { initial?: CustomerInitial }) {
  const router = useRouter()
  const { toast } = useToast()
  const isEdit = Boolean(initial?.id)
  const [v, setV] = useState({
    name: initial?.name ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    address: initial?.address ?? '',
    notes: initial?.notes ?? '',
  })
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch(isEdit ? `/api/pharmacy/customers/${initial!.id}` : '/api/pharmacy/customers', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Could not save', description: data?.error, variant: 'destructive' })
        return
      }
      toast({ title: isEdit ? 'Customer updated' : 'Customer added' })
      router.push('/pharmacy/customers')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1"><Label>Name *</Label><Input required value={v.name} onChange={(e) => setV((s) => ({ ...s, name: e.target.value }))} /></div>
      <div className="space-y-1"><Label>Phone</Label><Input value={v.phone} onChange={(e) => setV((s) => ({ ...s, phone: e.target.value }))} /></div>
      <div className="space-y-1"><Label>Email</Label><Input type="email" value={v.email} onChange={(e) => setV((s) => ({ ...s, email: e.target.value }))} /></div>
      <div className="space-y-1 sm:col-span-2"><Label>Address</Label><Input value={v.address} onChange={(e) => setV((s) => ({ ...s, address: e.target.value }))} /></div>
      <div className="space-y-1 sm:col-span-2"><Label>Notes</Label><textarea className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={v.notes} onChange={(e) => setV((s) => ({ ...s, notes: e.target.value }))} /></div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={busy} className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add customer'}
        </button>
      </div>
    </form>
  )
}
