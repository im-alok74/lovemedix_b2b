import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-server'

export default async function AddMedicinePage() {
  const user = await getCurrentUser()
  if (!user || user.user_type !== 'pharmacy') {
    redirect('/signin')
  }

  // Pharmacies should not add catalog medicines directly.
  // They must procure stock from distributors, then publish purchased stock.
  redirect('/pharmacy/procurement')
}
