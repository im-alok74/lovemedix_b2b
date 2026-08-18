import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getCurrentUser } from "@/lib/auth-server"
import { DistributorPurchaseRequestsTable } from "@/components/distributor/distributor-purchase-requests-table"
import { DistributorOutOfStockRequests } from "@/components/distributor/distributor-out-of-stock-requests"

export default async function DistributorProcurementRequestsPage() {
  const user = await getCurrentUser()
  if (!user || user.user_type !== "distributor") {
    redirect("/signin")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/5 py-8">
        <div className="container mx-auto px-4 max-w-6xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Procurement Requests</h1>
            <p className="text-muted-foreground mt-1">
              Manage pharmacy requests and out-of-stock fulfillment requests.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Out-of-Stock Requests</h2>
            <p className="text-muted-foreground mb-4">
              Pharmacies are requesting medicines that are currently out of stock. Fulfill these requests if you have stock available.
            </p>
            <DistributorOutOfStockRequests />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Purchase Requests</h2>
            <p className="text-muted-foreground mb-4">
              Approve pharmacy purchase requests and mark COD payments as collected.
            </p>
            <DistributorPurchaseRequestsTable />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

