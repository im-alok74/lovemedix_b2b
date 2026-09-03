import type { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import { requireApprovedPharmacy } from '@/lib/auth'
import { handleApiError, ok } from '@/lib/api-response'
import { parseListParams, pageMeta } from '@/lib/list-params'

/**
 * Pharmacy-facing catalog: one row per distributor listing that is in stock, active,
 * unexpired, and owned by an approved+active distributor.
 */
export async function GET(request: NextRequest) {
  try {
    await requireApprovedPharmacy()
    const sp = new URL(request.url).searchParams
    const { page, limit, skip, search } = parseListParams(sp, { limit: 24, maxLimit: 60 })
    const categoryId = Number(sp.get('categoryId')) || undefined

    const where: Prisma.DistributorListingWhereInput = {
      isActive: true,
      quantity: { gt: 0 },
      expiryDate: { gt: new Date() },
      distributor: { verificationStatus: 'VERIFIED', isActive: true },
      ...(categoryId ? { medicine: { categoryId } } : {}),
      ...(search
        ? {
            medicine: {
              ...(categoryId ? { categoryId } : {}),
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { genericName: { contains: search, mode: 'insensitive' } },
                { manufacturer: { contains: search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    }

    const [rows, total] = await Promise.all([
      prisma.distributorListing.findMany({
        where,
        orderBy: [{ unitPrice: 'asc' }],
        skip,
        take: limit,
        select: {
          id: true,
          unitPrice: true,
          mrp: true,
          quantity: true,
          reservedQuantity: true,
          minOrderQuantity: true,
          batchNumber: true,
          expiryDate: true,
          distributor: { select: { id: true, companyName: true, city: true, minOrderValue: true } },
          medicine: {
            select: { id: true, name: true, strength: true, form: true, packSize: true, manufacturer: true, gstRate: true, requiresPrescription: true, photoUrl: true, category: { select: { name: true } } },
          },
        },
      }),
      prisma.distributorListing.count({ where }),
    ])

    return ok({
      items: rows.map((r) => ({
        listingId: r.id,
        unitPrice: Number(r.unitPrice),
        mrp: Number(r.mrp),
        available: r.quantity - r.reservedQuantity,
        minOrderQuantity: r.minOrderQuantity,
        batchNumber: r.batchNumber,
        expiryDate: r.expiryDate,
        distributor: { id: r.distributor.id, name: r.distributor.companyName, city: r.distributor.city, minOrderValue: Number(r.distributor.minOrderValue) },
        medicine: {
          id: r.medicine.id,
          name: r.medicine.name,
          strength: r.medicine.strength,
          form: r.medicine.form,
          packSize: r.medicine.packSize,
          manufacturer: r.medicine.manufacturer,
          gstRate: Number(r.medicine.gstRate),
          requiresPrescription: r.medicine.requiresPrescription,
          photoUrl: r.medicine.photoUrl,
          category: r.medicine.category?.name ?? null,
        },
      })),
      ...pageMeta(total, page, limit),
    })
  } catch (error) {
    return handleApiError(error, 'pharmacy/catalog GET')
  }
}
