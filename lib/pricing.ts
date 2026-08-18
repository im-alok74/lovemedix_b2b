/**
 * Single source of truth for money.
 *
 * Every surface that shows a price — cart, checkout summary, order creation, invoice —
 * must go through this module. Previously each one recomputed totals its own way and
 * the checkout route simply trusted whatever numbers the browser posted.
 *
 * All amounts are rupees. Values are rounded to 2 decimals at each boundary so the
 * invoice, the DB row and the number the customer saw can never disagree by a paisa.
 */

/** Free delivery at or above this order subtotal. */
export const FREE_DELIVERY_THRESHOLD = 500

/** Flat delivery charge below the free-delivery threshold. */
export const DELIVERY_CHARGE = 40

/** Fallback GST rate (%) when a medicine has no explicit rate set. */
export const DEFAULT_GST_RATE = 5

export function toPaisaSafe(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export interface PricedLineInput {
  medicineId: number
  quantity: number
  /** Pharmacy's listed price per unit, read from pharmacy_inventory. */
  sellingPrice: number
  /** Discount % off the selling price, read from pharmacy_inventory. */
  discountPercentage: number
  /** GST % for this medicine, read from medicines.gst_rate. */
  gstRate?: number
}

export interface PricedLine {
  medicineId: number
  quantity: number
  /** Per-unit price before discount. */
  unitPrice: number
  discountPercentage: number
  /** Per-unit rupee value of the discount. */
  unitDiscount: number
  /** quantity x (unitPrice - unitDiscount), pre-tax. */
  lineTotal: number
  gstRate: number
  gstAmount: number
}

export interface OrderTotals {
  lines: PricedLine[]
  /** Sum of all line totals, after item discounts, before tax. */
  subtotal: number
  /** Total rupee value of item-level discounts. */
  discountAmount: number
  /** Sum of per-line GST. */
  taxAmount: number
  deliveryCharge: number
  /** subtotal + taxAmount + deliveryCharge. */
  totalAmount: number
}

export function priceLine(input: PricedLineInput): PricedLine {
  const quantity = Math.max(1, Math.floor(input.quantity))
  const unitPrice = toPaisaSafe(Math.max(0, input.sellingPrice))
  const discountPercentage = Math.min(100, Math.max(0, input.discountPercentage || 0))
  const gstRate = input.gstRate ?? DEFAULT_GST_RATE

  const unitDiscount = toPaisaSafe(unitPrice * (discountPercentage / 100))
  const lineTotal = toPaisaSafe((unitPrice - unitDiscount) * quantity)
  const gstAmount = toPaisaSafe(lineTotal * (gstRate / 100))

  return {
    medicineId: input.medicineId,
    quantity,
    unitPrice,
    discountPercentage,
    unitDiscount,
    lineTotal,
    gstRate,
    gstAmount,
  }
}

export function calculateOrderTotals(inputs: PricedLineInput[]): OrderTotals {
  const lines = inputs.map(priceLine)

  const subtotal = toPaisaSafe(lines.reduce((sum, l) => sum + l.lineTotal, 0))
  const discountAmount = toPaisaSafe(
    lines.reduce((sum, l) => sum + l.unitDiscount * l.quantity, 0),
  )
  const taxAmount = toPaisaSafe(lines.reduce((sum, l) => sum + l.gstAmount, 0))
  const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE
  const totalAmount = toPaisaSafe(subtotal + taxAmount + deliveryCharge)

  return { lines, subtotal, discountAmount, taxAmount, deliveryCharge, totalAmount }
}

export function formatINR(value: number | string | null | undefined): string {
  const amount = typeof value === "number" ? value : Number.parseFloat(String(value ?? 0))
  if (!Number.isFinite(amount)) return "₹0.00"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** How much more the customer must add to unlock free delivery. 0 when already free. */
export function amountToFreeDelivery(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : toPaisaSafe(FREE_DELIVERY_THRESHOLD - subtotal)
}
