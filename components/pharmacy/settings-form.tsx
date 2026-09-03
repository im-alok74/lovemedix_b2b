'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export interface PharmacySettings {
  pharmacyName: string
  contactPerson: string
  phone: string
  email: string
  gstNumber: string
  registrationNumber: string
  drugLicenseNumber: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
}

export function PharmacySettingsForm({ initial }: { initial: PharmacySettings }) {
  const router = useRouter()
  const { toast } = useToast()
  const [v, setV] = useState(initial)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/pharmacy/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Could not save', description: data?.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Profile updated' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      {(
        [
          ['pharmacyName', 'Pharmacy name'],
          ['contactPerson', 'Contact person'],
          ['phone', 'Phone'],
          ['email', 'Email'],
          ['gstNumber', 'GSTIN'],
          ['registrationNumber', 'Registration number'],
          ['drugLicenseNumber', 'Drug licence number'],
          ['addressLine1', 'Address line 1'],
          ['addressLine2', 'Address line 2'],
          ['city', 'City'],
          ['state', 'State'],
          ['pincode', 'Pincode'],
        ] as [keyof PharmacySettings, string][]
      ).map(([key, label]) => (
        <div key={key} className="space-y-1">
          <Label>{label}</Label>
          <Input value={v[key]} onChange={(e) => setV((s) => ({ ...s, [key]: e.target.value }))} />
        </div>
      ))}
      <div className="sm:col-span-2">
        <button type="submit" disabled={busy} className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
