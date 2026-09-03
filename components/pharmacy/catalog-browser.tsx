'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, Minus, Plus, Check, PackageSearch } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { formatINR } from '@/lib/money'
import { readCart, upsertLine, removeLine, type CartLine } from '@/lib/cart'

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
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartLine[]>([])

  useEffect(() => {
    const sync = () => setCart(readCart())
    sync()
    window.addEventListener('lovemedix:cart', sync)
    return () => window.removeEventListener('lovemedix:cart', sync)
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
      setTotal(data.data.total)
    }
    setLoading(false)
  }, [page, q, categoryId])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  const cartByListing = useMemo(() => new Map(cart.map((l) => [l.listingId, l])), [cart])
  const cartTotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0)

  function setQty(item: CatalogItem, qty: number) {
    if (qty <= 0) {
      removeLine(item.listingId)
      return
    }
    const clamped = Math.min(qty, item.available)
    upsertLine({
      listingId: item.listingId,
      distributorId: item.distributor.id,
      distributorName: item.distributor.name,
      medicineName: `${item.medicine.name}${item.medicine.strength ? ` ${item.medicine.strength}` : ''}`,
      unitPrice: item.unitPrice,
      minOrderQuantity: item.minOrderQuantity,
      available: item.available,
      quantity: clamped,
    })
  }

  return (
    <div className="pb-24">
      {/* Filters */}
      <div className="sticky top-16 z-20 -mx-4 mb-5 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value) }}
              placeholder="Search medicines, brands, molecules…"
              className="pl-9"
            />
          </div>
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
          <span className="ml-auto text-sm text-muted-foreground">{total} listings</span>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <PackageSearch className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No listings match your search</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different term, or{' '}
            <Link href="/pharmacy/requests/new" className="text-primary hover:underline">raise a medicine request</Link>.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const line = cartByListing.get(item.listingId)
            const saving = item.mrp > 0 ? Math.round(((item.mrp - item.unitPrice) / item.mrp) * 100) : 0
            return (
              <div key={item.listingId} className="flex flex-col rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold leading-snug">
                      {item.medicine.name}{item.medicine.strength ? ` ${item.medicine.strength}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[item.medicine.form, item.medicine.packSize, item.medicine.manufacturer].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {item.medicine.requiresPrescription ? (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Rx</span>
                  ) : null}
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-semibold tabular-nums">{formatINR(item.unitPrice)}</span>
                  <span className="text-xs text-muted-foreground line-through">{formatINR(item.mrp)}</span>
                  {saving > 0 ? <span className="text-xs font-semibold text-emerald-600">{saving}% off MRP</span> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.distributor.name} · {item.distributor.city} · {item.available} in stock · MOQ {item.minOrderQuantity}
                </p>
                <p className="text-xs text-muted-foreground">
                  batch {item.batchNumber ?? '—'} · exp {new Date(item.expiryDate).toLocaleDateString()}
                </p>

                <div className="mt-auto pt-3">
                  {line ? (
                    <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 p-1">
                      <button onClick={() => setQty(item, line.quantity - 1)} className="flex h-8 w-8 items-center justify-center rounded hover:bg-background">
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={line.quantity}
                        min={1}
                        max={item.available}
                        onChange={(e) => setQty(item, Number(e.target.value))}
                        className="w-14 bg-transparent text-center text-sm font-semibold tabular-nums outline-none"
                      />
                      <button onClick={() => setQty(item, line.quantity + 1)} className="flex h-8 w-8 items-center justify-center rounded hover:bg-background">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setQty(item, Math.max(item.minOrderQuantity, 1)); toast({ title: 'Added to cart', description: item.medicine.name }) }}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <ShoppingCart className="h-4 w-4" /> Add to cart
                    </button>
                  )}
                  {line && line.quantity < item.minOrderQuantity ? (
                    <p className="mt-1 text-xs text-amber-700">Below minimum order of {item.minOrderQuantity}</p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-50">Next</button>
          </div>
        </div>
      ) : null}

      {/* Sticky cart bar */}
      {cart.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="text-sm">
              <span className="font-semibold">{cart.length}</span> item{cart.length > 1 ? 's' : ''} ·{' '}
              <span className="font-semibold tabular-nums">{formatINR(cartTotal)}</span>
            </div>
            <Link href="/pharmacy/cart" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Check className="h-4 w-4" /> Review & place order
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
