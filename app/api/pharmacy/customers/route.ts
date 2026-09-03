import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireApprovedPharmacy } from '@/lib/auth'
import { badRequest, conflict, handleApiError, ok } from '@/lib/api-response'
import { customerSchema, safeParse } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const { pharmacyId } = await requireApprovedPharmacy()
    const q = new URL(request.url).searchParams.get('q')?.trim().slice(0, 100) ?? ''
    const customers = await prisma.customer.findMany({
      where: {
        pharmacyId,
        ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }] } : {}),
      },
      orderBy: { name: 'asc' },
      take: 20,
      select: { id: true, name: true, phone: true },
    })
    return ok(customers)
  } catch (error) {
    return handleApiError(error, 'pharmacy/customers GET')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pharmacyId } = await requireApprovedPharmacy()
    const parsed = safeParse(customerSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data
    try {
      const customer = await prisma.customer.create({
        data: {
          pharmacyId,
          name: d.name,
          phone: d.phone || null,
          email: d.email || null,
          address: d.address || null,
          notes: d.notes || null,
        },
      })
      return ok(customer, 201)
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'P2002') {
        return conflict('A customer with this phone number already exists')
      }
      throw e
    }
  } catch (error) {
    return handleApiError(error, 'pharmacy/customers POST')
  }
}
