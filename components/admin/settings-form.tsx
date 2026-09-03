'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface Setting {
  key: string
  value: string | null
  type: string
  description: string | null
}

export function SettingsForm({ settings }: { settings: Setting[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value ?? ''])),
  )
  const [busy, setBusy] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: settings.map((s) => ({ key: s.key, value: values[s.key] ?? '' })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Could not save', description: data?.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Settings saved' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      {settings.map((s) => (
        <div key={s.key} className="space-y-1">
          <Label>{s.key}</Label>
          {s.type === 'boolean' ? (
            <select
              className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
              value={values[s.key] ?? 'false'}
              onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <Input
              value={values[s.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
              className="max-w-md"
            />
          )}
          {s.description ? <p className="text-xs text-muted-foreground">{s.description}</p> : null}
        </div>
      ))}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  )
}
