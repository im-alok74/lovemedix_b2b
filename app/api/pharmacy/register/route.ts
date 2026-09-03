import { NextResponse } from 'next/server'
import { signUp } from '@/lib/auth'
import { safeParse, pharmacyRegisterSchema } from '@/lib/validation'
import { badRequest, ok, conflict } from '@/lib/api-response'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = safeParse(pharmacyRegisterSchema, body)

    if (!parsed.ok) {
      return badRequest(parsed.error, 'VALIDATION_ERROR')
    }

    const data = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return conflict('An account with this email already exists')
    }

    const user = await signUp(data.email, data.password, data.fullName, data.phone, 'PHARMACY')

    await prisma.pharmacyProfile.create({
      data: {
        userId: user.id,
        pharmacyName: data.pharmacyName,
        registrationNumber: data.registrationNumber,
        gstNumber: data.gstNumber,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        licenseNumber: data.licenseNumber,
        verificationStatus: 'PENDING',
      },
    })

    return ok({ success: true, user }, 201)
  } catch (error) {
    console.error('[pharmacy/register] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to register pharmacy' },
      { status: 500 },
    )
  }
}

import prisma from '@/lib/prisma'
