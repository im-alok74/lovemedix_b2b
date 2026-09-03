import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireApprovedDistributor } from '@/lib/auth'
import { badRequest, conflict, handleApiError, ok } from '@/lib/api-response'
import { listingSchema, safeParse } from '@/lib/validation'

function optionalDate(v?: string | null) {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function POST(request: NextRequest) {
  try {
    const { distributorId } = await requireApprovedDistributor()
    const parsed = safeParse(listingSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data

    const medicine = await prisma.medicine.findFirst({ where: { id: d.medicineId, status: 'ACTIVE' } })
    if (!medicine) return badRequest('Unknown medicine', 'NOT_FOUND')

    const expiry = optionalDate(d.expiryDate)
    if (!expiry) return badRequest('Invalid expiry date')
    if (expiry.getTime() < Date.now()) return badRequest('Expiry date is in the past')

    try {
      const listing = await prisma.distributorListing.create({
        data: {
          distributorId,
          medicineId: d.medicineId,
          batchNumber: d.batchNumber || null,
          mfgDate: optionalDate(d.mfgDate),
          expiryDate: expiry,
          mrp: d.mrp,
          unitPrice: d.unitPrice,
          quantity: d.quantity,
          minOrderQuantity: d.minOrderQuantity ?? 1,
          hsnCode: d.hsnCode || null,
          notes: d.notes || null,
          isActive: d.isActive ?? true,
        },
      })
      return ok(listing, 201)
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'P2002') {
        return conflict('You already have a listing for this medicine and batch')
      }
      throw e
    }
  } catch (error) {
    return handleApiError(error, 'distributor/listings POST')
  }
}
