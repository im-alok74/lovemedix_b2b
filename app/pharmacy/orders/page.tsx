import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function PharmacyOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { pharmacyId } = await requirePharmacyProfile()
  const params = await searchParams
  const status = params.status || ''

  const where: string[] = [`bo.pharmacy_id = ${pharmacyId}`]
  if (status) {
    where.push(`bo.order_status = ${status}`)
  }
  const whereSql = where.join(' AND ')

  const orders = await sql`
    SELECT
      bo.id,
      bo.order_number,
      bo.order_status,
      bo.payment_status,
      bo.total_amount,
      bo.created_at,
      dp.company_name AS distributor_name,
      COUNT(boi.id) AS item_count
    FROM b2b_orders bo
    JOIN distributor_profiles dp ON dp.id = bo.distributor_id
    LEFT JOIN b2b_order_items boi ON boi.order_id = bo.id
    WHERE ${sql.unsafe(whereSql)}
    GROUP BY bo.id, dp.id
    ORDER BY bo.created_at DESC
  `

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">My B2B Orders</h1>

          <div className="mb-6 flex gap-2">
            <Button asChild variant={status === '' ? 'default' : 'outline'}>
              <Link href="/pharmacy/orders">All</Link>
            </Button>
            {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
              <Button key={s} asChild variant={status === s ? 'default' : 'outline'}>
                <Link href={`/pharmacy/orders?status=${s}`}>{s}</Link>
              </Button>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Distributor</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orders as any[]).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.distributor_name}</TableCell>
                    <TableCell>{order.item_count}</TableCell>
                    <TableCell>₹{Number(order.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.payment_status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.order_status === 'DELIVERED' ? 'default' : order.order_status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                        {order.order_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/pharmacy/orders/${order.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(orders as any[]).length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No orders found</div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
