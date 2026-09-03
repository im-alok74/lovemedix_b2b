import { signOut } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    await signOut()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
