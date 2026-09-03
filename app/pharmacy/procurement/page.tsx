import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'
import { PharmacyProcurementMarketplace } from '@/components/pharmacy/pharmacy-procurement-marketplace'
import { PharmacyPurchaseRequestsList } from '@/components/pharmacy/pharmacy-purchase-requests-list'
import { PharmacyOutOfStockRequests } from '@/components/pharmacy/pharmacy-out-of-stock-requests'

export default async function PharmacyProcurementPage() {
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
        <div className="container mx-auto px-4 py-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Distributor Procurement</h1>
            <p className="text-muted-foreground mt-1">
              Browse distributor stock, request unavailable medicines, and place B2B orders.
            </p>
          </div>
          <PharmacyProcurementMarketplace />
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Your Out of Stock Requests</h2>
            <PharmacyOutOfStockRequests />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Your Purchase Requests</h2>
            <PharmacyPurchaseRequestsList />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
