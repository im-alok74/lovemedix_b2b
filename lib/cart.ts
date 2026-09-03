'use client'

/** Pharmacy procurement cart — per-browser, localStorage. One purchase order per distributor. */

export interface CartLine {
  listingId: number
  distributorId: number
  distributorName: string
  medicineName: string
  unitPrice: number
  minOrderQuantity: number
  available: number
  quantity: number
}

const KEY = 'lovemedix.pharmacy.cart.v1'

export function readCart(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CartLine[]) : []
  } catch {
    return []
  }
}

export function writeCart(lines: CartLine[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines))
    window.dispatchEvent(new CustomEvent('lovemedix:cart'))
  } catch {
    /* storage disabled */
  }
}

export function upsertLine(line: CartLine) {
  const cart = readCart()
  const i = cart.findIndex((l) => l.listingId === line.listingId)
  if (i >= 0) cart[i] = { ...cart[i], quantity: line.quantity }
  else cart.push(line)
  writeCart(cart)
}

export function removeLine(listingId: number) {
  writeCart(readCart().filter((l) => l.listingId !== listingId))
}

export function clearCart() {
  writeCart([])
}

export function groupByDistributor(cart: CartLine[]) {
  const groups = new Map<number, { distributorId: number; distributorName: string; lines: CartLine[] }>()
  for (const line of cart) {
    const g = groups.get(line.distributorId) ?? {
      distributorId: line.distributorId,
      distributorName: line.distributorName,
      lines: [],
    }
    g.lines.push(line)
    groups.set(line.distributorId, g)
  }
  return [...groups.values()]
}
