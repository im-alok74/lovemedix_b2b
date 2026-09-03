import type { NextRequest } from 'next/server'

import prisma from '@/lib/prisma'
import { signUp } from '@/lib/auth'
import { badRequest, conflict, handleApiError, ok, tooManyRequests } from '@/lib/api-response'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import { pharmacyRegisterSchema, safeParse } from '@/lib/validation'

function optionalDate(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(clientKey(request, 'pharmacy-register'), 5, 60 * 60 * 1000)
    if (!limit.allowed) return tooManyRequests(limit.retryAfter)

    const parsed = safeParse(pharmacyRegisterSchema, await request.json())
    if (!parsed.ok) return badRequest(parsed.error, 'VALIDATION_ERROR')
    const d = parsed.data

    if (await prisma.user.findUnique({ where: { email: d.email } })) {
      return conflict('An account with this email already exists')
    }

    const user = await signUp(d.email, d.password, d.fullName, d.phone, 'PHARMACY', {
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    })

    const profile = await prisma.pharmacyProfile.create({
      data: {
        userId: user.id,
        pharmacyName: d.pharmacyName,
        registrationNumber: d.registrationNumber || null,
        gstNumber: d.gstNumber || null,
        drugLicenseNumber: d.drugLicenseNumber || null,
        licenseExpiry: optionalDate(d.licenseExpiry),
        contactPerson: d.contactPerson || null,
        phone: d.phone,
        email: d.email,
        addressLine1: d.addressLine1,
        addressLine2: d.addressLine2 || null,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
        verificationStatus: 'PENDING',
      },
    })

    await prisma.auditLog.create({
      data: { actorId: user.id, action: 'pharmacy.register', entityType: 'PharmacyProfile', entityId: String(profile.id) },
    })

    return ok({ user, profileId: profile.id, verificationStatus: 'PENDING' }, 201)
  } catch (error) {
    return handleApiError(error, 'pharmacy/register')
  }
}
