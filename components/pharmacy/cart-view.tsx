'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { useToast } from '@/hooks/use-toast'
import { formatINR } from '@/lib/money'
import { clearCart, groupByDistributor, readCart, removeLine, writeCart, type CartLine } from '@/lib/cart'

export function CartView() {
  const router = useRouter()
  const { toast } = useToast()
  const [cart, setCart] = useState<CartLine[]>([])
  const [busy, setBusy] = useState<number | null>(null)

  useEffect(() => {
    setCart(readCart())
    const h = () => setCart(readCart())
    window.addEventListener('lovemedix:cart', h)
    return () => window.removeEventListener('lovemedix:cart', h)
  }, [])

  function setQty(listingId: number, qty: number) {
    const next = readCart().map((l) => (l.listingId === listingId ? { ...l, quantity: Math.max(1, qty) } : l))
    writeCart(next)
    setCart(next)
  }

  async function placeOrder(distributorId: number, lines: CartLine[]) {
    setBusy(distributorId)
    try {
      const res = await fetch('/api/pharmacy/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distributorId,
          items: lines.map((l) => ({ distributorListingId: l.listingId, quantity: l.quantity })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Could not place order', description: data?.error, variant: 'destructive' })
        return
      }
      writeCart(readCart().filter((l) => l.distributorId !== distributorId))
      setCart(readCart())
      toast({ title: `Order ${data.data.orderNumber} placed` })
      router.push(`/pharmacy/purchase-orders/${data.data.id}`)
    } finally {
      setBusy(null)
    }
  }

  if (cart.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Your cart is empty. <Link href="/pharmacy/catalog" className="text-primary hover:underline">Browse the catalog →</Link>
      </p>
    )
  }

  const groups = groupByDistributor(cart)

  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const total = g.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
        return (
          <div key={g.distributorId} className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <p className="font-medium">{g.distributorName}</p>
              <span className="text-sm text-muted-foreground">order subtotal {formatINR(total)}</span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {g.lines.map((l) => (
                  <tr key={l.listingId}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{l.medicineName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatINR(l.unitPrice)} each · MOQ {l.minOrderQuantity} · {l.available} available
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        min={1}
                        max={l.available}
                        value={l.quantity}
                        onChange={(e) => setQty(l.listingId, Number(e.target.value))}
                        className="h-9 w-20 rounded-md border border-input bg-background px-2 text-right text-sm"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(l.unitPrice * l.quantity)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => removeLine(l.listingId)} className="text-xs text-red-600 hover:underline">remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-end gap-3 border-t border-border p-4">
              {g.lines.some((l) => l.quantity < l.minOrderQuantity) ? (
                <span className="text-xs text-amber-700">Some quantities are below the minimum order.</span>
              ) : null}
              <button
                onClick={() => placeOrder(g.distributorId, g.lines)}
                disabled={busy === g.distributorId}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {busy === g.distributorId ? 'Placing…' : `Place order — ${formatINR(total)}`}
              </button>
            </div>
          </div>
        )
      })}
      <button onClick={() => { clearCart(); setCart([]) }} className="text-sm text-muted-foreground hover:underline">
        Clear cart
      </button>
    </div>
  )
}
