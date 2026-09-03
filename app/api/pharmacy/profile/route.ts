import { NextRequest, NextResponse } from 'next/server'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const { pharmacyId } = await requirePharmacyProfile()

    const profile = await sql`
      SELECT
        pp.*,
        u.email,
        u.phone AS user_phone,
        u.full_name
      FROM pharmacy_profiles pp
      JOIN users u ON u.id = pp.user_id
      WHERE pp.id = ${pharmacyId}
      LIMIT 1
    `

    if (!profile.length) {
      return notFound('Pharmacy profile not found')
    }

    return ok({ profile: profile[0] })
  } catch (error) {
    return handleApiError(error, 'PHARMACY PROFILE')
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const body = await request.json()
    const {
      pharmacyName,
      registrationNumber,
      gstNumber,
      contactPerson,
      phone,
      email,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      licenseNumber,
      licenseExpiry,
      notes,
    } = body

    const result = await sql`
      UPDATE pharmacy_profiles
      SET
        pharmacy_name = COALESCE(${pharmacyName}, pharmacy_name),
        registration_number = COALESCE(${registrationNumber}, registration_number),
        gst_number = COALESCE(${gstNumber}, gst_number),
        contact_person = COALESCE(${contactPerson}, contact_person),
        phone = COALESCE(${phone}, phone),
        email = COALESCE(${email}, email),
        address_line1 = COALESCE(${addressLine1}, address_line1),
        address_line2 = COALESCE(${addressLine2}, address_line2),
        city = COALESCE(${city}, city),
        state = COALESCE(${state}, state),
        pincode = COALESCE(${pincode}, pincode),
        license_number = COALESCE(${licenseNumber}, license_number),
        license_expiry = COALESCE(${licenseExpiry}, license_expiry),
        notes = COALESCE(${notes}, notes),
        updated_at = NOW()
      WHERE id = ${pharmacyId}
      RETURNING *
    `

    revalidatePath('/pharmacy/settings')
    return ok({ profile: result[0] })
  } catch (error) {
    return handleApiError(error, 'PHARMACY PROFILE UPDATE')
  }
}
