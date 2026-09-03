import prisma from '@/lib/prisma'
import { computeLine, round2, sumLines } from '@/lib/money'
import { nextBillNumber } from '@/lib/numbering'

export class SaleError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
    this.name = 'SaleError'
  }
}

interface SaleItemInput {
  inventoryId?: number | null
  medicineId: number
  description: string
  quantity: number
  unitPrice: number
  discountPercent?: number
  gstRate?: number
  batchNumber?: string | null
}

interface CreateSaleInput {
  pharmacyId: number
  customerId?: number | null
  customerName?: string | null
  customerPhone?: string | null
  paymentMethod?: string | null
  amountPaid?: number
  discountAmount?: number
  prescriptionRef?: string | null
  notes?: string | null
  items: SaleItemInput[]
}

/** Create a customer bill and decrement pharmacy inventory in one transaction. */
export async function createSale(input: CreateSaleInput) {
  return prisma.$transaction(async (tx) => {
    // Resolve / create the customer.
    let customerId = input.customerId ?? null
    if (!customerId && input.customerName?.trim()) {
      const existing = input.customerPhone
        ? await tx.customer.findFirst({ where: { pharmacyId: input.pharmacyId, phone: input.customerPhone } })
        : null
      customerId =
        existing?.id ??
        (
          await tx.customer.create({
            data: {
              pharmacyId: input.pharmacyId,
              name: input.customerName.trim(),
              phone: input.customerPhone || null,
            },
          })
        ).id
    }

    const lineTotals = input.items.map((it) =>
      computeLine({ quantity: it.quantity, unitPrice: it.unitPrice, discountPercent: it.discountPercent ?? 0, gstRate: it.gstRate ?? 0 }),
    )
    const totals = sumLines(lineTotals)
    const extraDiscount = round2(Math.max(0, input.discountAmount ?? 0))
    const grandTotal = round2(Math.max(0, totals.totalAmount - extraDiscount))
    const amountPaid = round2(Math.min(input.amountPaid ?? grandTotal, grandTotal))
    const paymentStatus = amountPaid >= grandTotal ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'PENDING'

    // Decrement inventory where a batch line was chosen.
    for (const it of input.items) {
      if (!it.inventoryId) continue
      const inv = await tx.pharmacyInventory.findFirst({
        where: { id: it.inventoryId, pharmacyId: input.pharmacyId },
        select: { id: true, quantity: true, medicineId: true },
      })
      if (!inv) throw new SaleError('An inventory line in this bill no longer exists', 409)
      if (inv.quantity < it.quantity) throw new SaleError('Not enough stock for one of the items', 409)
      await tx.pharmacyInventory.update({ where: { id: inv.id }, data: { quantity: { decrement: it.quantity } } })
    }

    const billNumber = await nextBillNumber(input.pharmacyId, tx)
    const sale = await tx.sale.create({
      data: {
        pharmacyId: input.pharmacyId,
        customerId,
        billNumber,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: round2(totals.discountAmount + extraDiscount),
        totalAmount: grandTotal,
        amountPaid,
        paymentStatus,
        paymentMethod: input.paymentMethod || null,
        prescriptionRef: input.prescriptionRef || null,
        notes: input.notes || null,
        items: {
          create: input.items.map((it, i) => ({
            medicineId: it.medicineId,
            pharmacyInventoryId: it.inventoryId ?? null,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discountPercent: it.discountPercent ?? 0,
            gstRate: it.gstRate ?? 0,
            lineTotal: lineTotals[i].lineTotal,
            batchNumber: it.batchNumber || null,
          })),
        },
      },
      include: { items: true, customer: true },
    })
    return sale
  })
}
