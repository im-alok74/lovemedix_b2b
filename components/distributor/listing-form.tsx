'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface MedicineHit {
  id: number
  name: string
  strength: string | null
  manufacturer: string | null
  mrp: string
}

export interface ListingInitial {
  id?: number
  medicineId?: number
  medicineLabel?: string
  batchNumber?: string
  mfgDate?: string
  expiryDate?: string
  mrp?: string
  unitPrice?: string
  quantity?: string
  minOrderQuantity?: string
  hsnCode?: string
  isActive?: boolean
}

export function ListingForm({ initial }: { initial?: ListingInitial }) {
  const router = useRouter()
  const { toast } = useToast()
  const isEdit = Boolean(initial?.id)
  const [v, setV] = useState({
    medicineId: initial?.medicineId ? String(initial.medicineId) : '',
    medicineLabel: initial?.medicineLabel ?? '',
    batchNumber: initial?.batchNumber ?? '',
    mfgDate: initial?.mfgDate ?? '',
    expiryDate: initial?.expiryDate ?? '',
    mrp: initial?.mrp ?? '',
    unitPrice: initial?.unitPrice ?? '',
    quantity: initial?.quantity ?? '',
    minOrderQuantity: initial?.minOrderQuantity ?? '1',
    hsnCode: initial?.hsnCode ?? '',
    isActive: initial?.isActive ?? true,
  })
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<MedicineHit[]>([])
  const [busy, setBusy] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (isEdit || query.trim().length < 2) {
      setHits([])
      return
    }
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      const res = await fetch(`/api/distributor/medicines?q=${encodeURIComponent(query)}`)
      const data = await res.json().catch(() => ({}))
      if (data?.success) setHits(data.data)
    }, 250)
  }, [query, isEdit])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!v.medicineId) {
      toast({ title: 'Pick a medicine first', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch(isEdit ? `/api/distributor/listings/${initial!.id}` : '/api/distributor/listings', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: Number(v.medicineId),
          batchNumber: v.batchNumber,
          mfgDate: v.mfgDate,
          expiryDate: v.expiryDate,
          mrp: Number(v.mrp),
          unitPrice: Number(v.unitPrice),
          quantity: Number(v.quantity),
          minOrderQuantity: Number(v.minOrderQuantity || 1),
          hsnCode: v.hsnCode,
          isActive: v.isActive,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Could not save', description: data?.error, variant: 'destructive' })
        return
      }
      toast({ title: isEdit ? 'Listing updated' : 'Listing added' })
      router.push('/distributor/listings')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {isEdit ? (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm font-medium">{v.medicineLabel}</div>
      ) : (
        <div className="space-y-1">
          <Label>Medicine</Label>
          {v.medicineId ? (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3 text-sm">
              <span className="font-medium">{v.medicineLabel}</span>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setV((s) => ({ ...s, medicineId: '', medicineLabel: '' }))}
              >
                change
              </button>
            </div>
          ) : (
            <>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the catalog…" />
              {hits.length > 0 ? (
                <ul className="mt-1 max-h-56 overflow-auto rounded-md border border-border">
                  {hits.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() =>
                          setV((s) => ({
                            ...s,
                            medicineId: String(h.id),
                            medicineLabel: `${h.name}${h.strength ? ` ${h.strength}` : ''}${h.manufacturer ? ` · ${h.manufacturer}` : ''}`,
                            mrp: s.mrp || h.mrp,
                          }))
                        }
                      >
                        {h.name} {h.strength} <span className="text-muted-foreground">{h.manufacturer}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Batch number"><Input value={v.batchNumber} onChange={(e) => setV((s) => ({ ...s, batchNumber: e.target.value }))} /></Field>
        <Field label="HSN code"><Input value={v.hsnCode} onChange={(e) => setV((s) => ({ ...s, hsnCode: e.target.value }))} /></Field>
        <Field label="Manufacture date"><Input type="date" value={v.mfgDate} onChange={(e) => setV((s) => ({ ...s, mfgDate: e.target.value }))} /></Field>
        <Field label="Expiry date *"><Input type="date" required value={v.expiryDate} onChange={(e) => setV((s) => ({ ...s, expiryDate: e.target.value }))} /></Field>
        <Field label="MRP *"><Input type="number" step="0.01" required value={v.mrp} onChange={(e) => setV((s) => ({ ...s, mrp: e.target.value }))} /></Field>
        <Field label="Your unit price *"><Input type="number" step="0.01" required value={v.unitPrice} onChange={(e) => setV((s) => ({ ...s, unitPrice: e.target.value }))} /></Field>
        <Field label="Quantity in stock *"><Input type="number" required value={v.quantity} onChange={(e) => setV((s) => ({ ...s, quantity: e.target.value }))} /></Field>
        <Field label="Minimum order qty"><Input type="number" value={v.minOrderQuantity} onChange={(e) => setV((s) => ({ ...s, minOrderQuantity: e.target.value }))} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={v.isActive} onChange={(e) => setV((s) => ({ ...s, isActive: e.target.checked }))} />
        Visible to pharmacies
      </label>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add listing'}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
