import prisma from '@/lib/prisma'

import type { Prisma } from '@prisma/client'

type PrismaTxLike = typeof prisma | Prisma.TransactionClient

/**
 * Human-readable document numbers: <PREFIX>-<YY><MM>-<seq>, where seq is a per-scope
 * running count. Generated inside the same transaction as the row it labels so two
 * concurrent creates cannot collide (unique constraint is the backstop).
 */

function period(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${yy}${mm}`
}

async function setting(key: string, fallback: string): Promise<string> {
  const row = await prisma.platformSetting.findUnique({ where: { key } })
  return row?.value?.trim() || fallback
}

export async function nextPurchaseOrderNumber(tx: PrismaTxLike = prisma): Promise<string> {
  const prefix = await setting('purchase_order_prefix', 'PO')
  const p = period()
  const count = await tx.purchaseOrder.count({
    where: { orderNumber: { startsWith: `${prefix}-${p}-` } },
  })
  return `${prefix}-${p}-${String(count + 1).padStart(5, '0')}`
}

export async function nextInvoiceNumber(tx: PrismaTxLike = prisma): Promise<string> {
  const prefix = await setting('invoice_prefix', 'INV')
  const p = period()
  const count = await tx.invoice.count({ where: { invoiceNumber: { startsWith: `${prefix}-${p}-` } } })
  return `${prefix}-${p}-${String(count + 1).padStart(5, '0')}`
}

export async function nextBillNumber(pharmacyId: number, tx: PrismaTxLike = prisma): Promise<string> {
  const p = period()
  const count = await tx.sale.count({
    where: { pharmacyId, billNumber: { startsWith: `B-${p}-` } },
  })
  return `B-${p}-${String(count + 1).padStart(5, '0')}`
}

/** URL-safe slug from a medicine name + strength, with a short random suffix for uniqueness. */
export function medicineSlug(name: string, strength?: string | null): string {
  const base = [name, strength]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 280)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base}-${suffix}`
}
