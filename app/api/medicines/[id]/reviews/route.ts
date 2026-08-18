import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { sql } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const medicineId = Number(id)

    if (Number.isNaN(medicineId)) {
      return NextResponse.json({ error: 'Invalid medicine ID' }, { status: 400 })
    }

    const reviews = await sql`
      SELECT
        mr.id,
        mr.rating,
        mr.title,
        mr.review_text,
        mr.is_verified_purchase,
        mr.created_at,
        u.full_name,
        u.user_type
      FROM medicine_reviews mr
      JOIN users u ON u.id = mr.user_id
      WHERE mr.medicine_id = ${medicineId}
      ORDER BY mr.created_at DESC
      LIMIT 50
    `

    const stats = await sql`
      SELECT
        COUNT(*)::int AS total_reviews,
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS average_rating,
        COUNT(*) FILTER (WHERE rating = 5)::int AS five_star,
        COUNT(*) FILTER (WHERE rating = 4)::int AS four_star,
        COUNT(*) FILTER (WHERE rating = 3)::int AS three_star,
        COUNT(*) FILTER (WHERE rating = 2)::int AS two_star,
        COUNT(*) FILTER (WHERE rating = 1)::int AS one_star
      FROM medicine_reviews
      WHERE medicine_id = ${medicineId}
    `

    return NextResponse.json({
      reviews,
      stats: stats[0] || {
        total_reviews: 0,
        average_rating: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0,
      },
    })
  } catch (error) {
    console.error('[medicine-reviews] Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.user_type !== 'customer') {
      return NextResponse.json({ error: 'Only customers can add reviews' }, { status: 403 })
    }

    const { id } = await params
    const medicineId = Number(id)

    if (Number.isNaN(medicineId)) {
      return NextResponse.json({ error: 'Invalid medicine ID' }, { status: 400 })
    }

    const body = await request.json()
    const rating = Number(body.rating)
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const reviewText = typeof body.reviewText === 'string' ? body.reviewText.trim() : ''

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    if (!reviewText) {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO medicine_reviews (
        medicine_id,
        user_id,
        rating,
        title,
        review_text,
        is_verified_purchase
      )
      VALUES (
        ${medicineId},
        ${user.id},
        ${rating},
        ${title || null},
        ${reviewText},
        false
      )
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      reviewId: result[0]?.id,
    })
  } catch (error) {
    console.error('[medicine-reviews] Error creating review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
