import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { requireApprovedPharmacy } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { customerSchema, safeParse } from '@/lib/validation'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { pharmacyId } = await requireApprovedPharmacy()
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')
    if (!(await prisma.customer.findFirst({ where: { id, pharmacyId } }))) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    const parsed = safeParse(customerSchema.partial(), await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.phone !== undefined ? { phone: d.phone || null } : {}),
        ...(d.email !== undefined ? { email: d.email || null } : {}),
        ...(d.address !== undefined ? { address: d.address || null } : {}),
        ...(d.notes !== undefined ? { notes: d.notes || null } : {}),
      },
    })
    return ok(customer)
  } catch (error) {
    return handleApiError(error, 'pharmacy/customers/[id] PATCH')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { pharmacyId } = await requireApprovedPharmacy()
    const id = Number((await params).id)
    if (!Number.isInteger(id)) return badRequest('Invalid id')
    const c = await prisma.customer.findFirst({ where: { id, pharmacyId }, select: { _count: { select: { sales: true } } } })
    if (!c) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    if (c._count.sales > 0) return badRequest('This customer has sales history and cannot be deleted')
    await prisma.customer.delete({ where: { id } })
    return ok({ id, deleted: true })
  } catch (error) {
    return handleApiError(error, 'pharmacy/customers/[id] DELETE')
  }
}
