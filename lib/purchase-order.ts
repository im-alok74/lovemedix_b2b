import prisma from '@/lib/prisma'
import { computeLine, sumLines, type LineTotals } from '@/lib/money'
import { nextInvoiceNumber, nextPurchaseOrderNumber } from '@/lib/numbering'

export class OrderError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
    this.name = 'OrderError'
  }
}

interface CreateInput {
  pharmacyId: number
  distributorId: number
  pharmacyNote?: string | null
  expectedBy?: Date | null
  items: { distributorListingId: number; quantity: number }[]
}

/**
 * Pharmacy places a bulk order against a distributor's listings. Runs in one
 * transaction: validates stock, reserves quantity, snapshots price/batch/expiry,
 * writes the order + items + opening event.
 */
export async function createPurchaseOrder(input: CreateInput) {
  return prisma.$transaction(async (tx) => {
    const distributor = await tx.distributorProfile.findUnique({
      where: { id: input.distributorId },
      select: { verificationStatus: true, isActive: true, minOrderValue: true },
    })
    if (!distributor || distributor.verificationStatus !== 'VERIFIED' || !distributor.isActive) {
      throw new OrderError('This distributor is not available for orders', 409)
    }

    const listingIds = input.items.map((i) => i.distributorListingId)
    const listings = await tx.distributorListing.findMany({
      where: { id: { in: listingIds }, distributorId: input.distributorId, isActive: true },
      include: { medicine: { select: { gstRate: true, name: true } } },
    })
    const byId = new Map(listings.map((l) => [l.id, l]))

    const itemRows: {
      medicineId: number
      distributorListingId: number
      quantity: number
      unitPrice: number
      mrp: number
      gstRate: number
      batchNumber: string | null
      expiryDate: Date | null
      totals: LineTotals
    }[] = []

    for (const item of input.items) {
      const listing = byId.get(item.distributorListingId)
      if (!listing) throw new OrderError('One of the selected items is no longer available', 409)
      const available = listing.quantity - listing.reservedQuantity
      if (item.quantity < listing.minOrderQuantity) {
        throw new OrderError(`Minimum order for ${listing.medicine.name} is ${listing.minOrderQuantity}`, 409)
      }
      if (item.quantity > available) {
        throw new OrderError(`Only ${available} units of ${listing.medicine.name} are available`, 409)
      }
      const gstRate = Number(listing.medicine.gstRate)
      const totals = computeLine({ quantity: item.quantity, unitPrice: Number(listing.unitPrice), gstRate })
      itemRows.push({
        medicineId: listing.medicineId,
        distributorListingId: listing.id,
        quantity: item.quantity,
        unitPrice: Number(listing.unitPrice),
        mrp: Number(listing.mrp),
        gstRate,
        batchNumber: listing.batchNumber,
        expiryDate: listing.expiryDate,
        totals,
      })
    }

    const totals = sumLines(itemRows.map((r) => r.totals))
    if (Number(distributor.minOrderValue) > 0 && totals.totalAmount < Number(distributor.minOrderValue)) {
      throw new OrderError(`Order total is below this distributor's minimum of ₹${distributor.minOrderValue}`, 409)
    }

    for (const r of itemRows) {
      await tx.distributorListing.update({
        where: { id: r.distributorListingId },
        data: { reservedQuantity: { increment: r.quantity } },
      })
    }

    const orderNumber = await nextPurchaseOrderNumber(tx)
    const order = await tx.purchaseOrder.create({
      data: {
        orderNumber,
        pharmacyId: input.pharmacyId,
        distributorId: input.distributorId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        pharmacyNote: input.pharmacyNote || null,
        expectedBy: input.expectedBy ?? null,
        items: {
          create: itemRows.map((r) => ({
            medicineId: r.medicineId,
            distributorListingId: r.distributorListingId,
            quantity: r.quantity,
            unitPrice: r.unitPrice,
            mrp: r.mrp,
            gstRate: r.gstRate,
            lineTotal: r.totals.lineTotal,
            batchNumber: r.batchNumber,
            expiryDate: r.expiryDate,
          })),
        },
        events: { create: { status: 'PENDING', note: 'Order placed', actorId: null } },
      },
      include: { distributor: { select: { userId: true } } },
    })

    await tx.notification.create({
      data: {
        userId: order.distributor.userId,
        type: 'purchase_order.new',
        title: `New purchase order ${orderNumber}`,
        link: `/distributor/purchase-orders/${order.id}`,
      },
    })

    return order
  })
}

type Transition = 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED'

const ALLOWED: Record<string, Transition[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
}

/**
 * Distributor (or pharmacy, for cancel) moves an order along its lifecycle.
 * Releasing reservations and decrementing real stock happen here so the two
 * never drift from the order status.
 */
export async function transitionPurchaseOrder(
  orderId: number,
  to: Transition,
  actor: { userId: number; role: 'PHARMACY' | 'DISTRIBUTOR' },
  note?: string | null,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { items: true, pharmacy: { select: { userId: true } }, distributor: { select: { userId: true } } },
    })
    if (!order) throw new OrderError('Order not found', 404)

    const isPharmacy = actor.role === 'PHARMACY' && order.pharmacy.userId === actor.userId
    const isDistributor = actor.role === 'DISTRIBUTOR' && order.distributor.userId === actor.userId
    if (!isPharmacy && !isDistributor) throw new OrderError('Not your order', 403)

    if (!ALLOWED[order.status]?.includes(to)) {
      throw new OrderError(`Cannot move an order from ${order.status} to ${to}`, 409)
    }
    // Pharmacies may only cancel a not-yet-processing order.
    if (isPharmacy && !(to === 'CANCELLED' && ['PENDING', 'CONFIRMED'].includes(order.status))) {
      throw new OrderError('Pharmacies can only cancel pending orders', 403)
    }

    const releasesStock = to === 'CANCELLED' || to === 'REJECTED'
    const consumesStock = to === 'SHIPPED'

    for (const item of order.items) {
      if (!item.distributorListingId) continue
      if (releasesStock) {
        await tx.distributorListing.update({
          where: { id: item.distributorListingId },
          data: { reservedQuantity: { decrement: item.quantity } },
        })
      }
      if (consumesStock) {
        await tx.distributorListing.update({
          where: { id: item.distributorListingId },
          data: {
            quantity: { decrement: item.quantity },
            reservedQuantity: { decrement: item.quantity },
          },
        })
      }
    }

    const timestamps: Record<string, Partial<Record<'confirmedAt' | 'shippedAt' | 'deliveredAt' | 'cancelledAt', Date>>> = {
      CONFIRMED: { confirmedAt: new Date() },
      SHIPPED: { shippedAt: new Date() },
      DELIVERED: { deliveredAt: new Date() },
      CANCELLED: { cancelledAt: new Date() },
      REJECTED: { cancelledAt: new Date() },
    }

    const updated = await tx.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: to,
        ...(timestamps[to] ?? {}),
        ...(actor.role === 'DISTRIBUTOR' && note ? { distributorNote: note } : {}),
        events: {
          create: {
            status: to,
            note: note ?? null,
            actorId: actor.userId,
          },
        },
      },
    })

    // Generate the B2B invoice when the distributor confirms.
    if (to === 'CONFIRMED') {
      const invoiceNumber = await nextInvoiceNumber(tx)
      await tx.invoice.create({
        data: {
          orderId,
          invoiceNumber,
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          totalAmount: order.totalAmount,
          paymentStatus: 'PENDING',
        },
      })
    }

    await tx.notification.create({
      data: {
        userId: isDistributor ? order.pharmacy.userId : order.distributor.userId,
        type: `purchase_order.${to.toLowerCase()}`,
        title: `Order ${order.orderNumber} ${to.toLowerCase()}`,
        link: isDistributor ? `/pharmacy/purchase-orders/${orderId}` : `/distributor/purchase-orders/${orderId}`,
      },
    })

    return updated
  })
}
