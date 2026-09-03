import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, XCircle, Loader2 } from 'lucide-react'

function CancelOrderButton({ orderId }: { orderId: number }) {
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/pharmacy/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: 'CANCELLED' }),
      })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to cancel order')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="destructive" onClick={handleCancel} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
      Cancel Order
    </Button>
  )
}

export default async function PharmacyOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { pharmacyId } = await requirePharmacyProfile()
  const orderId = Number((await params).orderId)

  if (Number.isNaN(orderId)) {
    redirect('/pharmacy/orders')
  }

  const orderRows = await sql`
    SELECT
      bo.id,
      bo.order_number,
      bo.subtotal,
      bo.tax_amount,
      bo.discount_amount,
      bo.total_amount,
      bo.order_status,
      bo.payment_status,
      bo.payment_method,
      bo.notes,
      bo.created_at,
      bo.updated_at,
      dp.company_name AS distributor_name,
      dp.contact_person AS distributor_contact,
      dp.phone AS distributor_phone,
      dp.email AS distributor_email,
      dp.address_line1 AS distributor_address,
      dp.city AS distributor_city,
      dp.state AS distributor_state,
      dp.pincode AS distributor_pincode
    FROM b2b_orders bo
    JOIN distributor_profiles dp ON dp.id = bo.distributor_id
    WHERE bo.id = ${orderId} AND bo.pharmacy_id = ${pharmacyId}
    LIMIT 1
  `

  if (!orderRows.length) {
    notFound()
  }

  const order = orderRows[0] as any

  const items = await sql`
    SELECT
      boi.quantity,
      boi.unit_price,
      boi.discount_percent,
      boi.line_total,
      boi.batch_number,
      boi.expiry_date,
      m.name AS medicine_name,
      m.generic_name,
      m.manufacturer
    FROM b2b_order_items boi
    JOIN medicines m ON m.id = boi.medicine_id
    WHERE boi.order_id = ${orderId}
    ORDER BY boi.id ASC
  `

  const history = await sql`
    SELECT status, changed_by, note, created_at
    FROM b2b_order_status_history
    WHERE order_id = ${orderId}
    ORDER BY created_at ASC
  `

  const canCancel = order.order_status === 'PENDING' || order.order_status === 'CONFIRMED'

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/pharmacy/orders"><ArrowLeft className="h-4 w-4 mr-2" />Back to Orders</Link>
          </Button>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Order {order.order_number}</h1>
              <p className="text-muted-foreground mt-1">
                Placed on {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={order.order_status === 'DELIVERED' ? 'default' : order.order_status === 'CANCELLED' ? 'destructive' : 'secondary'} className="text-sm">
                {order.order_status}
              </Badge>
              <Badge variant="outline" className="text-sm">{order.payment_status}</Badge>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{Number(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{Number(order.tax_amount).toFixed(2)}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{Number(order.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base border-t border-border pt-2">
                  <span>Total</span>
                  <span>₹{Number(order.total_amount).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distributor</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{order.distributor_name}</p>
                <p className="text-muted-foreground">{order.distributor_contact}</p>
                <p className="text-muted-foreground">{order.distributor_phone}</p>
                <p className="text-muted-foreground">{order.distributor_email}</p>
                <p className="text-muted-foreground">
                  {[order.distributor_address, order.distributor_city, order.distributor_state, order.distributor_pincode].filter(Boolean).join(', ')}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items as any[]).map((it: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{it.medicine_name}</div>
                          <div className="text-xs text-muted-foreground">{it.generic_name} {it.manufacturer}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{it.batch_number || '-'}</TableCell>
                      <TableCell>{it.quantity}</TableCell>
                      <TableCell>₹{Number(it.unit_price).toFixed(2)}</TableCell>
                      <TableCell>{Number(it.discount_percent || 0).toFixed(0)}%</TableCell>
                      <TableCell className="text-right">₹{Number(it.line_total).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {(history as any[]).length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(history as any[]).map((h: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                      <div>
                        <Badge variant="outline" className="mr-2">{h.status}</Badge>
                        <span className="text-muted-foreground">{h.note || ''}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {canCancel && (
            <div className="flex justify-end">
              <CancelOrderButton orderId={order.id} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
