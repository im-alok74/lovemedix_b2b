import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireDistributorProfile } from '@/lib/auth'
import { handleApiError, ok } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    await requireDistributorProfile()
    const q = new URL(request.url).searchParams.get('q')?.trim().slice(0, 120) ?? ''

    const medicines = await prisma.medicine.findMany({
      where: {
        status: 'ACTIVE',
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { genericName: { contains: q, mode: 'insensitive' } },
                { manufacturer: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: 25,
      select: { id: true, name: true, strength: true, manufacturer: true, form: true, packSize: true, mrp: true, gstRate: true },
    })
    return ok(medicines)
  } catch (error) {
    return handleApiError(error, 'distributor/medicines GET')
  }
}
