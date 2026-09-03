import { NextRequest, NextResponse } from 'next/server'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { pharmacyId } = await requirePharmacyProfile()
    const id = Number((await params).id)

    if (Number.isNaN(id)) {
      return badRequest('Invalid request id')
    }

    const reqResult = await sql`
      SELECT * FROM out_of_stock_requests WHERE id = ${id} AND pharmacy_id = ${pharmacyId}
    `
    if (!reqResult.length) {
      return notFound('Request not found')
    }
    const req = reqResult[0] as any

    if (!['PENDING', 'FULFILLED'].includes(req.status)) {
      return badRequest(`Cannot cancel ${req.status} request`)
    }

    await sql`
      UPDATE out_of_stock_requests
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE id = ${id}
    `

    revalidatePath('/pharmacy/out-of-stock-requests')
    return ok({ success: true })
  } catch (error) {
    return handleApiError(error, 'PHARMACY OUT OF STOCK REQUEST CANCEL')
  }
}
