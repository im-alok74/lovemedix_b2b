import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'
import { CustomerManagement } from '@/components/pharmacy/customer-management'

export default async function PharmacyCustomersPage() {
  const { pharmacyId } = await requirePharmacyProfile()

  const profile = await sql`
    SELECT pharmacy_name FROM pharmacy_profiles WHERE id = ${pharmacyId} LIMIT 1
  `
  if (!profile.length) {
    redirect('/pharmacy/register')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
            <p className="text-muted-foreground mt-1">Manage your customers</p>
          </div>
          <CustomerManagement />
        </div>
      </main>
      <Footer />
    </div>
  )
}
