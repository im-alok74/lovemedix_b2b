import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const categories = await sql`
      SELECT id, name, slug, description, display_order
      FROM categories
      WHERE is_active = true
      ORDER BY display_order ASC, name ASC
    `
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('[API] Categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
