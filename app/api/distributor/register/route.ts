import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { signUp } from '@/lib/auth'
import { safeParse, distributorRegisterSchema } from '@/lib/validation'
import { badRequest, ok, conflict } from '@/lib/api-response'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = safeParse(distributorRegisterSchema, body)

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

    const user = await signUp(data.email, data.password, data.fullName, data.phone, 'DISTRIBUTOR')

    await prisma.distributorProfile.create({
      data: {
        userId: user.id,
        companyName: data.companyName,
        businessLicense: data.businessLicense,
        taxId: data.taxId,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        serviceRadiusKm: data.serviceRadiusKm,
        verificationStatus: 'PENDING',
      },
    })

    return ok({ success: true, user }, 201)
  } catch (error) {
    console.error('[distributor/register] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to register distributor' },
      { status: 500 },
    )
  }
}
