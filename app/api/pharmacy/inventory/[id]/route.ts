import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { requireApprovedPharmacy } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { inventorySchema, safeParse } from '@/lib/validation'

function optionalDate(v?: string | null) {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { pharmacyId } = await requireApprovedPharmacy()
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')
    if (!(await prisma.pharmacyInventory.findFirst({ where: { id, pharmacyId } }))) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const parsed = safeParse(inventorySchema.partial(), await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data

    const row = await prisma.pharmacyInventory.update({
      where: { id },
      data: {
        ...(d.batchNumber !== undefined ? { batchNumber: d.batchNumber || null } : {}),
        ...(d.mfgDate !== undefined ? { mfgDate: optionalDate(d.mfgDate) } : {}),
        ...(d.expiryDate !== undefined ? { expiryDate: optionalDate(d.expiryDate) } : {}),
        ...(d.mrp !== undefined ? { mrp: d.mrp } : {}),
        ...(d.costPrice !== undefined ? { costPrice: d.costPrice } : {}),
        ...(d.sellingPrice !== undefined ? { sellingPrice: d.sellingPrice } : {}),
        ...(d.quantity !== undefined ? { quantity: d.quantity } : {}),
        ...(d.reorderLevel !== undefined ? { reorderLevel: d.reorderLevel } : {}),
        ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
      },
    })
    return ok(row)
  } catch (error) {
    return handleApiError(error, 'pharmacy/inventory/[id] PATCH')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { pharmacyId } = await requireApprovedPharmacy()
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')
    const row = await prisma.pharmacyInventory.findFirst({ where: { id, pharmacyId }, select: { id: true } })
    if (!row) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const sold = await prisma.saleItem.count({ where: { pharmacyInventoryId: id } })
    if (sold > 0) {
      await prisma.pharmacyInventory.update({ where: { id }, data: { isActive: false, quantity: 0 } })
      return ok({ id, deactivated: true })
    }
    await prisma.pharmacyInventory.delete({ where: { id } })
    return ok({ id, deleted: true })
  } catch (error) {
    return handleApiError(error, 'pharmacy/inventory/[id] DELETE')
  }
}
