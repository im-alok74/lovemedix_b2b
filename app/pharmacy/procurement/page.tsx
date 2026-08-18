import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { requireRole } from "@/lib/auth-server"
import { PharmacyProcurementMarketplace } from "@/components/pharmacy/pharmacy-procurement-marketplace"
import { PharmacyPurchaseRequestsList } from "@/components/pharmacy/pharmacy-purchase-requests-list"
import { PharmacyOutOfStockRequests } from "@/components/pharmacy/pharmacy-out-of-stock-requests"

export default async function PharmacyProcurementPage() {
  const user = await requireRole(["pharmacy"])

  if (!user) {
    redirect("/signin")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">Distributor Procurement</h1>
            <p className="text-muted-foreground">
              Browse distributor stock, request unavailable medicines, and track approvals.
            </p>
          </div>
          <PharmacyProcurementMarketplace />
          <div>
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              Your Medicine Requests
            </h2>
            <PharmacyOutOfStockRequests />
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              Your Purchase Requests
            </h2>
            <PharmacyPurchaseRequestsList />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

