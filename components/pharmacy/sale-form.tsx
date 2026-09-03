'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatINR, computeLine, sumLines, round2 } from '@/lib/money'
import { MedicineSearch } from '@/components/pharmacy/medicine-search'

interface InvOption {
  id: number
  medicineId: number
  label: string
  batchNumber: string | null
  sellingPrice: number
  gstRate: number
  available: number
}

interface Line {
  key: string
  inventoryId: number | null
  medicineId: number
  description: string
  quantity: number
  unitPrice: number
  discountPercent: number
  gstRate: number
  batchNumber: string | null
  available: number | null
}

export function SaleForm({ inventory }: { inventory: InvOption[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [lines, setLines] = useState<Line[]>([])
  const [invPick, setInvPick] = useState('')
  const [customer, setCustomer] = useState({ customerName: '', customerPhone: '' })
  const [payment, setPayment] = useState({ paymentMethod: 'Cash', amountPaid: '', discountAmount: '0', prescriptionRef: '', notes: '' })
  const [busy, setBusy] = useState(false)

  const totals = useMemo(() => {
    const t = sumLines(
      lines.map((l) => computeLine({ quantity: l.quantity, unitPrice: l.unitPrice, discountPercent: l.discountPercent, gstRate: l.gstRate })),
    )
    const extra = Math.max(0, Number(payment.discountAmount) || 0)
    return { ...t, grand: round2(Math.max(0, t.totalAmount - extra)) }
  }, [lines, payment.discountAmount])

  function addFromInventory() {
    const inv = inventory.find((i) => String(i.id) === invPick)
    if (!inv) return
    setLines((ls) => [
      ...ls,
      {
        key: crypto.randomUUID(),
        inventoryId: inv.id,
        medicineId: inv.medicineId,
        description: inv.label,
        quantity: 1,
        unitPrice: inv.sellingPrice,
        discountPercent: 0,
        gstRate: inv.gstRate,
        batchNumber: inv.batchNumber,
        available: inv.available,
      },
    ])
    setInvPick('')
  }

  function update(key: string, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (lines.length === 0) {
      toast({ title: 'Add at least one item', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/pharmacy/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.customerName || null,
          customerPhone: customer.customerPhone || null,
          paymentMethod: payment.paymentMethod,
          amountPaid: payment.amountPaid === '' ? totals.grand : Number(payment.amountPaid),
          discountAmount: Number(payment.discountAmount || 0),
          prescriptionRef: payment.prescriptionRef,
          notes: payment.notes,
          items: lines.map((l) => ({
            inventoryId: l.inventoryId,
            medicineId: l.medicineId,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discountPercent: l.discountPercent,
            gstRate: l.gstRate,
            batchNumber: l.batchNumber,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Could not create bill', description: data?.error, variant: 'destructive' })
        return
      }
      toast({ title: `Bill ${data.data.billNumber} created` })
      router.push(`/pharmacy/sales/${data.data.id}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Customer (optional)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1"><Label>Name</Label><Input value={customer.customerName} onChange={(e) => setCustomer((c) => ({ ...c, customerName: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Phone</Label><Input value={customer.customerPhone} onChange={(e) => setCustomer((c) => ({ ...c, customerPhone: e.target.value }))} /></div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Items</h2>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label>From inventory</Label>
            <select className="h-10 w-64 rounded-md border border-input bg-background px-3 text-sm" value={invPick} onChange={(e) => setInvPick(e.target.value)}>
              <option value="">Select a batch…</option>
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>{i.label} — {formatINR(i.sellingPrice)} ({i.available} left)</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={addFromInventory} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Add</button>
          <div className="ml-auto w-64">
            <Label>Or add off-catalog</Label>
            <MedicineSearch
              onPick={(m) =>
                setLines((ls) => [
                  ...ls,
                  {
                    key: crypto.randomUUID(),
                    inventoryId: null,
                    medicineId: m.id,
                    description: `${m.name}${m.strength ? ` ${m.strength}` : ''}`,
                    quantity: 1,
                    unitPrice: Number(m.mrp),
                    discountPercent: 0,
                    gstRate: Number(m.gstRate),
                    batchNumber: null,
                    available: null,
                  },
                ])
              }
            />
          </div>
        </div>

        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-1.5">Item</th>
                <th className="py-1.5 text-right">Qty</th>
                <th className="py-1.5 text-right">Price</th>
                <th className="py-1.5 text-right">Disc%</th>
                <th className="py-1.5 text-right">GST%</th>
                <th className="py-1.5 text-right">Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const t = computeLine({ quantity: l.quantity, unitPrice: l.unitPrice, discountPercent: l.discountPercent, gstRate: l.gstRate })
                return (
                  <tr key={l.key} className="border-t border-border">
                    <td className="py-1.5">
                      {l.description}
                      {l.batchNumber ? <span className="text-xs text-muted-foreground"> · {l.batchNumber}</span> : null}
                    </td>
                    <td className="py-1.5 text-right"><input type="number" min={1} max={l.available ?? undefined} value={l.quantity} onChange={(e) => update(l.key, { quantity: Number(e.target.value) })} className="h-8 w-16 rounded border border-input px-1 text-right" /></td>
                    <td className="py-1.5 text-right"><input type="number" step="0.01" value={l.unitPrice} onChange={(e) => update(l.key, { unitPrice: Number(e.target.value) })} className="h-8 w-20 rounded border border-input px-1 text-right" /></td>
                    <td className="py-1.5 text-right"><input type="number" step="0.01" value={l.discountPercent} onChange={(e) => update(l.key, { discountPercent: Number(e.target.value) })} className="h-8 w-14 rounded border border-input px-1 text-right" /></td>
                    <td className="py-1.5 text-right"><input type="number" step="0.01" value={l.gstRate} onChange={(e) => update(l.key, { gstRate: Number(e.target.value) })} className="h-8 w-14 rounded border border-input px-1 text-right" /></td>
                    <td className="py-1.5 text-right tabular-nums">{formatINR(t.lineTotal)}</td>
                    <td className="py-1.5 text-right"><button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="text-xs text-red-600 hover:underline">×</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Payment</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Method</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={payment.paymentMethod} onChange={(e) => setPayment((p) => ({ ...p, paymentMethod: e.target.value }))}>
                {['Cash', 'UPI', 'Card', 'Credit'].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label>Extra discount (₹)</Label><Input type="number" step="0.01" value={payment.discountAmount} onChange={(e) => setPayment((p) => ({ ...p, discountAmount: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Amount paid (blank = full)</Label><Input type="number" step="0.01" value={payment.amountPaid} onChange={(e) => setPayment((p) => ({ ...p, amountPaid: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Prescription ref</Label><Input value={payment.prescriptionRef} onChange={(e) => setPayment((p) => ({ ...p, prescriptionRef: e.target.value }))} /></div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Summary</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatINR(totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Line discounts</dt><dd>−{formatINR(totals.discountAmount)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">GST</dt><dd>{formatINR(totals.taxAmount)}</dd></div>
            <div className="flex justify-between border-t border-border pt-1 text-base font-semibold"><dt>Payable</dt><dd>{formatINR(totals.grand)}</dd></div>
          </dl>
          <button type="submit" disabled={busy} className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {busy ? 'Creating bill…' : 'Create bill'}
          </button>
        </div>
      </div>
    </form>
  )
}
