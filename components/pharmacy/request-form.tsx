'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { MedicineSearch } from '@/components/pharmacy/medicine-search'

export function RequestForm({ distributors }: { distributors: { id: number; name: string }[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [kind, setKind] = useState<'OUT_OF_STOCK' | 'NEW_MEDICINE'>('OUT_OF_STOCK')
  const [medicine, setMedicine] = useState<{ id: number; label: string } | null>(null)
  const [v, setV] = useState({ requestedName: '', manufacturer: '', strength: '', packSize: '', requestedQuantity: '1', distributorId: '', notes: '' })
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (kind === 'OUT_OF_STOCK' && !medicine) {
      toast({ title: 'Pick the medicine that is out of stock', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/pharmacy/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          medicineId: kind === 'OUT_OF_STOCK' ? medicine?.id : null,
          distributorId: v.distributorId ? Number(v.distributorId) : null,
          requestedName: kind === 'NEW_MEDICINE' ? v.requestedName : null,
          manufacturer: v.manufacturer,
          strength: v.strength,
          packSize: v.packSize,
          requestedQuantity: Number(v.requestedQuantity || 1),
          notes: v.notes,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Could not submit', description: data?.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Request submitted' })
      router.push('/pharmacy/requests')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex gap-2">
        {(['OUT_OF_STOCK', 'NEW_MEDICINE'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-md border px-3 py-1.5 text-sm ${kind === k ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
          >
            {k === 'OUT_OF_STOCK' ? 'Out-of-stock medicine' : 'New medicine'}
          </button>
        ))}
      </div>

      {kind === 'OUT_OF_STOCK' ? (
        <div className="space-y-1">
          <Label>Medicine</Label>
          {medicine ? (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3 text-sm">
              <span className="font-medium">{medicine.label}</span>
              <button type="button" className="text-xs text-primary hover:underline" onClick={() => setMedicine(null)}>change</button>
            </div>
          ) : (
            <MedicineSearch onPick={(m) => setMedicine({ id: m.id, label: `${m.name}${m.strength ? ` ${m.strength}` : ''}` })} />
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <Label>Medicine name *</Label>
          <Input value={v.requestedName} onChange={(e) => setV((s) => ({ ...s, requestedName: e.target.value }))} required />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1"><Label>Manufacturer</Label><Input value={v.manufacturer} onChange={(e) => setV((s) => ({ ...s, manufacturer: e.target.value }))} /></div>
        <div className="space-y-1"><Label>Strength</Label><Input value={v.strength} onChange={(e) => setV((s) => ({ ...s, strength: e.target.value }))} /></div>
        <div className="space-y-1"><Label>Pack size</Label><Input value={v.packSize} onChange={(e) => setV((s) => ({ ...s, packSize: e.target.value }))} /></div>
        <div className="space-y-1"><Label>Quantity needed</Label><Input type="number" value={v.requestedQuantity} onChange={(e) => setV((s) => ({ ...s, requestedQuantity: e.target.value }))} /></div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Route to a distributor (optional)</Label>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={v.distributorId} onChange={(e) => setV((s) => ({ ...s, distributorId: e.target.value }))}>
            <option value="">Any distributor</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Notes</Label>
          <textarea className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={v.notes} onChange={(e) => setV((s) => ({ ...s, notes: e.target.value }))} />
        </div>
      </div>

      <button type="submit" disabled={busy} className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
        {busy ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  )
}
