'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { ApiAction } from '@/components/dashboard/api-action'

interface Row {
  id: number
  name: string
  slug: string
  displayOrder: number
  isActive: boolean
  medicineCount: number
}

export function CategoryManager({ rows }: { rows: Row[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Could not add', description: data?.error, variant: 'destructive' })
        return
      }
      setName('')
      toast({ title: 'Category added' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" className="max-w-xs" />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          Add
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Slug</th>
              <th className="px-4 py-2.5 text-right">Medicines</th>
              <th className="px-4 py-2.5">Active</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2.5 font-medium">{c.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{c.medicineCount}</td>
                <td className="px-4 py-2.5">{c.isActive ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-2">
                    <ApiAction
                      endpoint={`/api/admin/categories/${c.id}`}
                      body={{ isActive: !c.isActive }}
                      label={c.isActive ? 'Deactivate' : 'Activate'}
                      variant="secondary"
                    />
                    <ApiAction
                      endpoint={`/api/admin/categories/${c.id}`}
                      method="DELETE"
                      label="Delete"
                      variant="danger"
                      confirm="Delete this category?"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
