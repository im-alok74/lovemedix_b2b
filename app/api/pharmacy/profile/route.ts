import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { requirePharmacyProfile } from '@/lib/auth'
import { badRequest, handleApiError, ok } from '@/lib/api-response'
import { z } from 'zod'
import { gstSchema, phoneSchema, safeParse } from '@/lib/validation'

const schema = z.object({
  pharmacyName: z.string().trim().min(2).max(255).optional(),
  contactPerson: z.string().trim().max(150).optional().nullable().or(z.literal('')),
  phone: phoneSchema.optional(),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal('')),
  gstNumber: gstSchema.optional().nullable().or(z.literal('')),
  registrationNumber: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  drugLicenseNumber: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  addressLine1: z.string().trim().min(5).max(255).optional(),
  addressLine2: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  city: z.string().trim().min(2).max(100).optional(),
  state: z.string().trim().min(2).max(100).optional(),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/).optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const parsed = safeParse(schema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data

    const profile = await prisma.pharmacyProfile.update({
      where: { id: pharmacyId },
      data: {
        ...(d.pharmacyName !== undefined ? { pharmacyName: d.pharmacyName } : {}),
        ...(d.contactPerson !== undefined ? { contactPerson: d.contactPerson || null } : {}),
        ...(d.phone !== undefined ? { phone: d.phone } : {}),
        ...(d.email !== undefined ? { email: d.email || null } : {}),
        ...(d.gstNumber !== undefined ? { gstNumber: d.gstNumber || null } : {}),
        ...(d.registrationNumber !== undefined ? { registrationNumber: d.registrationNumber || null } : {}),
        ...(d.drugLicenseNumber !== undefined ? { drugLicenseNumber: d.drugLicenseNumber || null } : {}),
        ...(d.addressLine1 !== undefined ? { addressLine1: d.addressLine1 } : {}),
        ...(d.addressLine2 !== undefined ? { addressLine2: d.addressLine2 || null } : {}),
        ...(d.city !== undefined ? { city: d.city } : {}),
        ...(d.state !== undefined ? { state: d.state } : {}),
        ...(d.pincode !== undefined ? { pincode: d.pincode } : {}),
      },
    })
    return ok(profile)
  } catch (error) {
    return handleApiError(error, 'pharmacy/profile PATCH')
  }
}
