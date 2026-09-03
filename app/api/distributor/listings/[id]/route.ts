import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { requireApprovedDistributor } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { listingSchema, safeParse } from '@/lib/validation'

function optionalDate(v?: string | null) {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

async function ownListing(id: number, distributorId: number) {
  return prisma.distributorListing.findFirst({ where: { id, distributorId } })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { distributorId } = await requireApprovedDistributor()
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')
    if (!(await ownListing(id, distributorId))) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const parsed = safeParse(listingSchema.partial(), await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data

    const listing = await prisma.distributorListing.update({
      where: { id },
      data: {
        ...(d.batchNumber !== undefined ? { batchNumber: d.batchNumber || null } : {}),
        ...(d.mfgDate !== undefined ? { mfgDate: optionalDate(d.mfgDate) } : {}),
        ...(d.expiryDate !== undefined && d.expiryDate ? { expiryDate: optionalDate(d.expiryDate)! } : {}),
        ...(d.mrp !== undefined ? { mrp: d.mrp } : {}),
        ...(d.unitPrice !== undefined ? { unitPrice: d.unitPrice } : {}),
        ...(d.quantity !== undefined ? { quantity: d.quantity } : {}),
        ...(d.minOrderQuantity !== undefined ? { minOrderQuantity: d.minOrderQuantity } : {}),
        ...(d.hsnCode !== undefined ? { hsnCode: d.hsnCode || null } : {}),
        ...(d.notes !== undefined ? { notes: d.notes || null } : {}),
        ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
      },
    })
    return ok(listing)
  } catch (error) {
    return handleApiError(error, 'distributor/listings/[id] PATCH')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { distributorId } = await requireApprovedDistributor()
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')
    const listing = await ownListing(id, distributorId)
    if (!listing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    if (listing.reservedQuantity > 0) {
      await prisma.distributorListing.update({ where: { id }, data: { isActive: false } })
      return ok({ id, deactivated: true })
    }
    const orderedItems = await prisma.purchaseOrderItem.count({ where: { distributorListingId: id } })
    if (orderedItems > 0) {
      await prisma.distributorListing.update({ where: { id }, data: { isActive: false, quantity: 0 } })
      return ok({ id, deactivated: true })
    }
    await prisma.distributorListing.delete({ where: { id } })
    return ok({ id, deleted: true })
  } catch (error) {
    return handleApiError(error, 'distributor/listings/[id] DELETE')
  }
}
