import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireApprovedPharmacy } from '@/lib/auth'
import { badRequest, conflict, handleApiError, ok } from '@/lib/api-response'
import { inventorySchema, safeParse } from '@/lib/validation'

function optionalDate(v?: string | null) {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function POST(request: NextRequest) {
  try {
    const { pharmacyId } = await requireApprovedPharmacy()
    const parsed = safeParse(inventorySchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data

    if (!(await prisma.medicine.findUnique({ where: { id: d.medicineId } }))) {
      return badRequest('Unknown medicine', 'NOT_FOUND')
    }

    try {
      const row = await prisma.pharmacyInventory.create({
        data: {
          pharmacyId,
          medicineId: d.medicineId,
          batchNumber: d.batchNumber || null,
          mfgDate: optionalDate(d.mfgDate),
          expiryDate: optionalDate(d.expiryDate),
          mrp: d.mrp,
          costPrice: d.costPrice ?? 0,
          sellingPrice: d.sellingPrice,
          quantity: d.quantity,
          reorderLevel: d.reorderLevel ?? 0,
          isActive: d.isActive ?? true,
        },
      })
      return ok(row, 201)
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'P2002') {
        return conflict('You already have an inventory line for this medicine and batch')
      }
      throw e
    }
  } catch (error) {
    return handleApiError(error, 'pharmacy/inventory POST')
  }
}
