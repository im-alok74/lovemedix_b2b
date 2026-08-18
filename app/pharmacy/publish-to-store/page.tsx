import { redirect } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { requireRole } from "@/lib/auth-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PharmacyPurchaseRequestsList } from "@/components/pharmacy/pharmacy-purchase-requests-list"

export default async function PharmacyPublishToStorePage() {
  const user = await requireRole(["pharmacy"])

  if (!user) {
    redirect("/signin")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Publish to Store</h1>
              <p className="text-muted-foreground">
                Publish your available stock so customers can order from your pharmacy.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="bg-transparent">
                <Link href="/pharmacy/inventory">View Store Inventory</Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent">
                <Link href="/pharmacy/procurement">Go to Procurement</Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Publish purchased stock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Only <span className="font-medium text-foreground">PAID</span> procurement requests can be
                published. Choose how customers will see pricing (MRP / discount / custom).
              </p>
              <PharmacyPurchaseRequestsList />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Your current store stock</CardTitle>
              <Button asChild size="sm" variant="outline" className="bg-transparent">
                <Link href="/pharmacy/inventory">Manage inventory</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This is the stock used on the website to match customer orders with your pharmacy.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

