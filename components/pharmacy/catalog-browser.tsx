'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { formatINR } from '@/lib/money'
import { readCart, upsertLine, type CartLine } from '@/lib/cart'

interface CatalogItem {
  listingId: number
  unitPrice: number
  mrp: number
  available: number
  minOrderQuantity: number
  batchNumber: string | null
  expiryDate: string
  distributor: { id: number; name: string; city: string; minOrderValue: number }
  medicine: {
    id: number
    name: string
    strength: string | null
    form: string | null
    packSize: string | null
    manufacturer: string | null
    gstRate: number
    requiresPrescription: boolean
    category: string | null
  }
}

export function CatalogBrowser({ categories }: { categories: { id: number; name: string }[] }) {
  const { toast } = useToast()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [q, setQ] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [cartIds, setCartIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    setCartIds(new Set(readCart().map((l) => l.listingId)))
    const handler = () => setCartIds(new Set(readCart().map((l) => l.listingId)))
    window.addEventListener('lovemedix:cart', handler)
    return () => window.removeEventListener('lovemedix:cart', handler)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (q.trim()) params.set('q', q.trim())
    if (categoryId) params.set('categoryId', categoryId)
    const res = await fetch(`/api/pharmacy/catalog?${params}`)
    const data = await res.json().catch(() => ({}))
    if (data?.success) {
      setItems(data.data.items)
      setTotalPages(data.data.totalPages)
    }
    setLoading(false)
  }, [page, q, categoryId])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  function add(item: CatalogItem) {
    const line: CartLine = {
      listingId: item.listingId,
      distributorId: item.distributor.id,
      distributorName: item.distributor.name,
      medicineName: `${item.medicine.name}${item.medicine.strength ? ` ${item.medicine.strength}` : ''}`,
      unitPrice: item.unitPrice,
      minOrderQuantity: item.minOrderQuantity,
      available: item.available,
      quantity: Math.max(item.minOrderQuantity, 1),
    }
    upsertLine(line)
    toast({ title: 'Added to cart', description: line.medicineName })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input value={q} onChange={(e) => { setPage(1); setQ(e.target.value) }} placeholder="Search medicines…" className="max-w-xs" />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={categoryId}
          onChange={(e) => { setPage(1); setCategoryId(e.target.value) }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <Link href="/pharmacy/cart" className="ml-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Cart ({cartIds.size})
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No listings match. Try a different search, or raise a medicine request.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.listingId} className="flex flex-col rounded-xl border border-border bg-card p-4">
              <p className="font-medium">
                {item.medicine.name}{item.medicine.strength ? ` ${item.medicine.strength}` : ''}
                {item.medicine.requiresPrescription ? <span className="ml-1 text-xs text-amber-700">Rx</span> : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {[item.medicine.form, item.medicine.packSize, item.medicine.manufacturer].filter(Boolean).join(' · ')}
              </p>
              <p className="mt-2 text-sm">
                <span className="font-semibold">{formatINR(item.unitPrice)}</span>
                <span className="ml-2 text-xs text-muted-foreground line-through">{formatINR(item.mrp)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {item.distributor.name}, {item.distributor.city} · {item.available} available · MOQ {item.minOrderQuantity}
              </p>
              <p className="text-xs text-muted-foreground">
                batch {item.batchNumber ?? '—'} · exp {new Date(item.expiryDate).toLocaleDateString()}
              </p>
              <button
                onClick={() => add(item)}
                disabled={cartIds.has(item.listingId)}
                className="mt-3 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {cartIds.has(item.listingId) ? 'In cart' : 'Add to cart'}
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50">Next</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
