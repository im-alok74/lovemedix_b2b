'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const FIELDS: { name: string; label: string; type?: string; required?: boolean; half?: boolean }[] = [
  { name: 'pharmacyName', label: 'Pharmacy name', required: true },
  { name: 'contactPerson', label: 'Contact person' },
  { name: 'fullName', label: 'Your full name', required: true, half: true },
  { name: 'phone', label: 'Phone', required: true, half: true },
  { name: 'email', label: 'Login email', type: 'email', required: true, half: true },
  { name: 'password', label: 'Password', type: 'password', required: true, half: true },
  { name: 'gstNumber', label: 'GSTIN', half: true },
  { name: 'drugLicenseNumber', label: 'Drug licence number', half: true },
  { name: 'registrationNumber', label: 'Shop registration no.', half: true },
  { name: 'licenseExpiry', label: 'Licence expiry', type: 'date', half: true },
  { name: 'addressLine1', label: 'Address line 1', required: true },
  { name: 'addressLine2', label: 'Address line 2' },
  { name: 'city', label: 'City', required: true, half: true },
  { name: 'state', label: 'State', required: true, half: true },
  { name: 'pincode', label: 'Pincode', required: true, half: true },
]

export function PharmacyRegisterForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/pharmacy/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Registration failed', description: data?.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Pharmacy registered', description: 'Next: upload your documents for verification.' })
      router.push('/pharmacy/documents')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.name} className={f.half ? 'space-y-1' : 'space-y-1 sm:col-span-2'}>
            <Label htmlFor={f.name}>
              {f.label} {f.required ? <span className="text-destructive">*</span> : null}
            </Label>
            <Input
              id={f.name}
              name={f.name}
              type={f.type ?? 'text'}
              required={f.required}
              value={values[f.name] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? 'Creating account…' : 'Register pharmacy'}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Already registered? <Link href="/signin" className="text-primary hover:underline">Sign in</Link>
      </p>
    </form>
  )
}
