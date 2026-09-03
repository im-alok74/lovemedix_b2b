import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Package,
  FileText,
  AlertCircle,
  ShoppingCart,
  TrendingUp,
  Users,
  Receipt,
  Settings,
} from 'lucide-react'

export default async function PharmacyDashboardPage() {
  const { pharmacyId } = await requirePharmacyProfile()

  const profile = await sql`
    SELECT pharmacy_name, verification_status, city, state
    FROM pharmacy_profiles
    WHERE id = ${pharmacyId}
    LIMIT 1
  `
  if (!profile.length) {
    redirect('/pharmacy/register')
  }

  const p = profile[0] as any

  const [
    inventoryStats,
    orderStats,
    purchaseStats,
    outOfStockStats,
    recentOrders,
    recentPurchaseRequests,
  ] = await Promise.all([
    sql`
      SELECT
        COUNT(*) AS total_items,
        COALESCE(SUM(quantity), 0) AS total_stock,
        COUNT(CASE WHEN quantity = 0 THEN 1 END) AS out_of_stock,
        COUNT(CASE WHEN quantity > 0 AND quantity < 10 THEN 1 END) AS low_stock
      FROM pharmacy_inventory
      WHERE pharmacy_id = ${pharmacyId}
    `,
    sql`
      SELECT
        COUNT(*) AS total_orders,
        COUNT(CASE WHEN order_status = 'PENDING' THEN 1 END) AS pending,
        COUNT(CASE WHEN order_status = 'CONFIRMED' THEN 1 END) AS confirmed,
        COUNT(CASE WHEN order_status = 'PROCESSING' THEN 1 END) AS processing,
        COUNT(CASE WHEN order_status = 'SHIPPED' THEN 1 END) AS shipped,
        COUNT(CASE WHEN order_status = 'DELIVERED' THEN 1 END) AS delivered,
        COUNT(CASE WHEN order_status = 'CANCELLED' THEN 1 END) AS cancelled
      FROM b2b_orders
      WHERE pharmacy_id = ${pharmacyId}
    `,
    sql`
      SELECT COUNT(*) AS pending_count
      FROM purchase_requests
      WHERE pharmacy_id = ${pharmacyId} AND status = 'PENDING'
    `,
    sql`
      SELECT COUNT(*) AS pending_count
      FROM out_of_stock_requests
      WHERE pharmacy_id = ${pharmacyId} AND status = 'PENDING'
    `,
    sql`
      SELECT id, order_number, order_status, total_amount, created_at, dp.company_name AS distributor_name
      FROM b2b_orders bo
      JOIN distributor_profiles dp ON dp.id = bo.distributor_id
      WHERE bo.pharmacy_id = ${pharmacyId}
      ORDER BY bo.created_at DESC
      LIMIT 5
    `,
    sql`
      SELECT pr.id, pr.status, pr.total_amount, pr.created_at, dp.company_name AS distributor_name
      FROM purchase_requests pr
      JOIN distributor_profiles dp ON dp.id = pr.distributor_id
      WHERE pr.pharmacy_id = ${pharmacyId}
      ORDER BY pr.created_at DESC
      LIMIT 5
    `,
  ])

  const inv = inventoryStats[0] as any
  const ord = orderStats[0] as any
  const recentOrdersList = recentOrders as any[]
  const recentPRList = recentPurchaseRequests as any[]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{p.pharmacy_name}</h1>
            <p className="text-muted-foreground">
              {[p.city, p.state].filter(Boolean).join(', ')}
            </p>
            <Badge variant={p.verification_status === 'VERIFIED' ? 'default' : 'secondary'} className="mt-2">
              {p.verification_status}
            </Badge>
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{inv.total_items}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {inv.out_of_stock} out of stock &middot; {inv.low_stock} low stock
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">B2B Orders</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{ord.total_orders}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {ord.pending} pending &middot; {ord.delivered} delivered
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Purchase Requests</CardTitle>
                <ShoppingCart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{purchaseStats.pending_count}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Pending approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock Requests</CardTitle>
                <AlertCircle className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{outOfStockStats.pending_count}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Pending requests
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/pharmacy/medicines">
                      <Package className="h-4 w-4 mr-2" />
                      Browse Catalog
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/pharmacy/procurement">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Procurement Marketplace
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/pharmacy/inventory">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Manage Inventory
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/pharmacy/orders">
                      <FileText className="h-4 w-4 mr-2" />
                      My Orders
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/pharmacy/purchase-requests">
                      <Receipt className="h-4 w-4 mr-2" />
                      Purchase Requests
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/pharmacy/out-of-stock-requests">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Out of Stock Requests
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/pharmacy/customers">
                      <Users className="h-4 w-4 mr-2" />
                      Customers
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/pharmacy/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent B2B Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentOrdersList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No orders yet</p>
                  ) : (
                    <div className="space-y-3">
                      {recentOrdersList.map((o: any) => (
                        <div key={o.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                          <div>
                            <p className="font-medium text-foreground">{o.order_number}</p>
                            <p className="text-xs text-muted-foreground">{o.distributor_name}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs mb-1">{o.order_status}</Badge>
                            <p className="text-xs font-semibold text-foreground">₹{Number(o.total_amount).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Purchase Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentPRList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No purchase requests yet</p>
                  ) : (
                    <div className="space-y-3">
                      {recentPRList.map((pr: any) => (
                        <div key={pr.id} className="border-b border-border pb-3 last:border-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-foreground">Request #{pr.id}</p>
                            <Badge variant="outline" className="text-xs">{pr.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{pr.distributor_name}</p>
                          <p className="text-xs font-semibold text-foreground">₹{Number(pr.total_amount).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">In Stock</span>
                      <span className="font-medium">{Number(inv.total_items) - Number(inv.out_of_stock) - Number(inv.low_stock)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${inv.total_items ? ((Number(inv.total_items) - Number(inv.out_of_stock) - Number(inv.low_stock)) / Number(inv.total_items)) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Low Stock</span>
                      <span className="font-medium">{inv.low_stock}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500"
                        style={{ width: `${inv.total_items ? (Number(inv.low_stock) / Number(inv.total_items)) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Out of Stock</span>
                      <span className="font-medium">{inv.out_of_stock}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${inv.total_items ? (Number(inv.out_of_stock) / Number(inv.total_items)) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
