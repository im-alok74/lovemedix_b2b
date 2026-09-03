import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requireApprovedDistributor } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { z } from 'zod'
import { safeParse } from '@/lib/validation'

/**
 * Bulk upsert of listings. The client parses the CSV/XLSX and posts JSON rows so this
 * route stays a pure data endpoint. Rows keyed by (medicineId, batchNumber).
 */
const rowSchema = z.object({
  medicineId: z.coerce.number().int().positive(),
  batchNumber: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  expiryDate: z.string().trim().min(1),
  mfgDate: z.string().trim().optional().nullable().or(z.literal('')),
  mrp: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(0),
  minOrderQuantity: z.coerce.number().int().min(1).optional().default(1),
  hsnCode: z.string().trim().max(20).optional().nullable().or(z.literal('')),
})
const bulkSchema = z.object({ rows: z.array(rowSchema).min(1).max(1000) })

export async function POST(request: NextRequest) {
  try {
    const { distributorId } = await requireApprovedDistributor()
    const parsed = safeParse(bulkSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')

    const medicineIds = [...new Set(parsed.data.rows.map((r) => r.medicineId))]
    const known = new Set(
      (await prisma.medicine.findMany({ where: { id: { in: medicineIds }, status: 'ACTIVE' }, select: { id: true } })).map(
        (m) => m.id,
      ),
    )

    const results = { created: 0, updated: 0, skipped: [] as { row: number; reason: string }[] }

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < parsed.data.rows.length; i++) {
        const r = parsed.data.rows[i]
        if (!known.has(r.medicineId)) {
          results.skipped.push({ row: i + 1, reason: `Unknown or inactive medicine ${r.medicineId}` })
          continue
        }
        const expiry = new Date(r.expiryDate)
        if (Number.isNaN(expiry.getTime())) {
          results.skipped.push({ row: i + 1, reason: 'Invalid expiry date' })
          continue
        }
        const existing = await tx.distributorListing.findFirst({
          where: { distributorId, medicineId: r.medicineId, batchNumber: r.batchNumber || null },
          select: { id: true },
        })
        const data = {
          mfgDate: r.mfgDate ? new Date(r.mfgDate) : null,
          expiryDate: expiry,
          mrp: r.mrp,
          unitPrice: r.unitPrice,
          quantity: r.quantity,
          minOrderQuantity: r.minOrderQuantity ?? 1,
          hsnCode: r.hsnCode || null,
          isActive: true,
        }
        if (existing) {
          await tx.distributorListing.update({ where: { id: existing.id }, data })
          results.updated++
        } else {
          await tx.distributorListing.create({
            data: { distributorId, medicineId: r.medicineId, batchNumber: r.batchNumber || null, ...data },
          })
          results.created++
        }
      }
    })

    return ok(results)
  } catch (error) {
    return handleApiError(error, 'distributor/listings/bulk POST')
  }
}
