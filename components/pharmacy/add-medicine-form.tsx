'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function AddMedicineForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [medicines, setMedicines] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    medicineId: '',
    batchNumber: '',
    mfgDate: '',
    expiryDate: '',
    mrp: '',
    quantity: '',
    sellingPrice: '',
    discountPercent: '0',
  })

  useEffect(() => {
    fetch('/api/pharmacy/medicines?limit=50', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setMedicines(d.items || []))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/pharmacy/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: Number(form.medicineId),
          batchNumber: form.batchNumber || null,
          mfgDate: form.mfgDate || null,
          expiryDate: form.expiryDate,
          mrp: Number(form.mrp),
          quantity: Number(form.quantity),
          sellingPrice: Number(form.sellingPrice),
          discountPercent: Number(form.discountPercent || 0),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Success', description: 'Medicine added to inventory' })
        router.push('/pharmacy/inventory')
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to add medicine', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/pharmacy/inventory"><ArrowLeft className="h-4 w-4 mr-2" />Back to Inventory</Link>
      </Button>
      <h1 className="text-3xl font-bold text-foreground mb-6">Add Medicine to Inventory</h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="medicineId">Medicine</Label>
          <Select
            value={form.medicineId}
            onValueChange={(v) => setForm((f) => ({ ...f, medicineId: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select medicine" />
            </SelectTrigger>
            <SelectContent>
              {medicines.map((m: any) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name} - {m.generic_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="batchNumber">Batch Number</Label>
            <Input
              id="batchNumber"
              value={form.batchNumber}
              onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
              placeholder="Batch no."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mfgDate">Mfg Date</Label>
            <Input
              id="mfgDate"
              type="date"
              value={form.mfgDate}
              onChange={(e) => setForm((f) => ({ ...f, mfgDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mrp">MRP (₹)</Label>
            <Input
              id="mrp"
              type="number"
              step="0.01"
              value={form.mrp}
              onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">Selling Price (₹)</Label>
            <Input
              id="sellingPrice"
              type="number"
              step="0.01"
              value={form.sellingPrice}
              onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discountPercent">Discount %</Label>
            <Input
              id="discountPercent"
              type="number"
              step="0.01"
              value={form.discountPercent}
              onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add to Inventory'}
          </Button>
          <Button asChild variant="outline">
            <Link href="/pharmacy/inventory">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
