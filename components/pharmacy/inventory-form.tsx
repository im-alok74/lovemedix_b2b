'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { MedicineSearch } from '@/components/pharmacy/medicine-search'

export interface InventoryInitial {
  id?: number
  medicineId?: number
  medicineLabel?: string
  batchNumber?: string
  mfgDate?: string
  expiryDate?: string
  mrp?: string
  costPrice?: string
  sellingPrice?: string
  quantity?: string
  reorderLevel?: string
}

export function InventoryForm({ initial }: { initial?: InventoryInitial }) {
  const router = useRouter()
  const { toast } = useToast()
  const isEdit = Boolean(initial?.id)
  const [medicine, setMedicine] = useState<{ id: number; label: string } | null>(
    initial?.medicineId ? { id: initial.medicineId, label: initial.medicineLabel ?? '' } : null,
  )
  const [v, setV] = useState({
    batchNumber: initial?.batchNumber ?? '',
    mfgDate: initial?.mfgDate ?? '',
    expiryDate: initial?.expiryDate ?? '',
    mrp: initial?.mrp ?? '',
    costPrice: initial?.costPrice ?? '',
    sellingPrice: initial?.sellingPrice ?? '',
    quantity: initial?.quantity ?? '',
    reorderLevel: initial?.reorderLevel ?? '0',
  })
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!medicine) {
      toast({ title: 'Pick a medicine first', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch(isEdit ? `/api/pharmacy/inventory/${initial!.id}` : '/api/pharmacy/inventory', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: medicine.id,
          batchNumber: v.batchNumber,
          mfgDate: v.mfgDate,
          expiryDate: v.expiryDate,
          mrp: Number(v.mrp),
          costPrice: Number(v.costPrice || 0),
          sellingPrice: Number(v.sellingPrice),
          quantity: Number(v.quantity),
          reorderLevel: Number(v.reorderLevel || 0),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Could not save', description: data?.error, variant: 'destructive' })
        return
      }
      toast({ title: isEdit ? 'Inventory updated' : 'Added to inventory' })
      router.push('/pharmacy/inventory')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <Label>Medicine</Label>
        {medicine ? (
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3 text-sm">
            <span className="font-medium">{medicine.label}</span>
            {!isEdit ? (
              <button type="button" className="text-xs text-primary hover:underline" onClick={() => setMedicine(null)}>change</button>
            ) : null}
          </div>
        ) : (
          <MedicineSearch onPick={(m) => setMedicine({ id: m.id, label: `${m.name}${m.strength ? ` ${m.strength}` : ''}` })} />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Batch number"><Input value={v.batchNumber} onChange={(e) => setV((s) => ({ ...s, batchNumber: e.target.value }))} /></Field>
        <Field label="Manufacture date"><Input type="date" value={v.mfgDate} onChange={(e) => setV((s) => ({ ...s, mfgDate: e.target.value }))} /></Field>
        <Field label="Expiry date"><Input type="date" value={v.expiryDate} onChange={(e) => setV((s) => ({ ...s, expiryDate: e.target.value }))} /></Field>
        <Field label="MRP *"><Input type="number" step="0.01" required value={v.mrp} onChange={(e) => setV((s) => ({ ...s, mrp: e.target.value }))} /></Field>
        <Field label="Cost price"><Input type="number" step="0.01" value={v.costPrice} onChange={(e) => setV((s) => ({ ...s, costPrice: e.target.value }))} /></Field>
        <Field label="Selling price *"><Input type="number" step="0.01" required value={v.sellingPrice} onChange={(e) => setV((s) => ({ ...s, sellingPrice: e.target.value }))} /></Field>
        <Field label="Quantity *"><Input type="number" required value={v.quantity} onChange={(e) => setV((s) => ({ ...s, quantity: e.target.value }))} /></Field>
        <Field label="Reorder level"><Input type="number" value={v.reorderLevel} onChange={(e) => setV((s) => ({ ...s, reorderLevel: e.target.value }))} /></Field>
      </div>

      <button type="submit" disabled={busy} className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
        {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add to inventory'}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label>{label}</Label>{children}</div>
}
