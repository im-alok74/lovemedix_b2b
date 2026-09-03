import type { Prisma } from '@prisma/client'

export type Decimalish = Prisma.Decimal | number | string

export function toNumber(value: Decimalish): number {
  return typeof value === 'number' ? value : Number(value)
}

/** Round to 2 dp using standard half-up, avoiding binary float drift. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function formatINR(value: Decimalish): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(toNumber(value))
}

export interface LineInput {
  quantity: number
  unitPrice: Decimalish
  discountPercent?: Decimalish
  gstRate?: Decimalish
}

export interface LineTotals {
  gross: number
  discount: number
  taxable: number
  tax: number
  lineTotal: number
}

/** Per-line arithmetic shared by purchase orders and retail sales. */
export function computeLine(line: LineInput): LineTotals {
  const qty = Math.max(0, Math.trunc(line.quantity))
  const price = toNumber(line.unitPrice)
  const discPct = toNumber(line.discountPercent ?? 0)
  const gstPct = toNumber(line.gstRate ?? 0)

  const gross = round2(qty * price)
  const discount = round2((gross * discPct) / 100)
  const taxable = round2(gross - discount)
  const tax = round2((taxable * gstPct) / 100)
  const lineTotal = round2(taxable + tax)

  return { gross, discount, taxable, tax, lineTotal }
}

export interface OrderTotals {
  subtotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
}

export function sumLines(lines: LineTotals[]): OrderTotals {
  const subtotal = round2(lines.reduce((s, l) => s + l.gross, 0))
  const discountAmount = round2(lines.reduce((s, l) => s + l.discount, 0))
  const taxAmount = round2(lines.reduce((s, l) => s + l.tax, 0))
  const totalAmount = round2(lines.reduce((s, l) => s + l.lineTotal, 0))
  return { subtotal, discountAmount, taxAmount, totalAmount }
}
