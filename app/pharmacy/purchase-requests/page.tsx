import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function PharmacyPurchaseRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { pharmacyId } = await requirePharmacyProfile()
  const params = await searchParams
  const status = params.status || ''

  const where: string[] = [`pr.pharmacy_id = ${pharmacyId}`]
  if (status) {
    where.push(`pr.status = ${status}`)
  }
  const whereSql = where.join(' AND ')

  const requests = await sql`
    SELECT
      pr.id,
      pr.status,
      pr.total_amount,
      pr.notes,
      pr.expires_at,
      pr.fulfilled_at,
      pr.cancelled_at,
      pr.created_at,
      dp.company_name AS distributor_name,
      COUNT(pi.id) AS item_count,
      SUM(pi.quantity) AS total_quantity,
      pi_inv.invoice_number,
      pi_inv.payment_status AS invoice_payment_status,
      pi_inv.paid_at AS invoice_paid_at
    FROM purchase_requests pr
    JOIN distributor_profiles dp ON dp.id = pr.distributor_id
    LEFT JOIN purchase_items pi ON pi.request_id = pr.id
    LEFT JOIN purchase_invoices pi_inv ON pi_inv.request_id = pr.id
    WHERE ${sql.unsafe(whereSql)}
    GROUP BY pr.id, dp.id, pi_inv.id
    ORDER BY pr.created_at DESC
  `

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">Purchase Requests</h1>

          <div className="mb-6 flex gap-2">
            <Button asChild variant={status === '' ? 'default' : 'outline'}>
              <Link href="/pharmacy/purchase-requests">All</Link>
            </Button>
            {['PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED', 'COMPLETED'].map((s) => (
              <Button key={s} asChild variant={status === s ? 'default' : 'outline'}>
                <Link href={`/pharmacy/purchase-requests?status=${s}`}>{s}</Link>
              </Button>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Distributor</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(requests as any[]).map((pr) => (
                  <TableRow key={pr.id}>
                    <TableCell className="font-medium">#{pr.id}</TableCell>
                    <TableCell>{pr.distributor_name}</TableCell>
                    <TableCell>{pr.item_count}</TableCell>
                    <TableCell>₹{Number(pr.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        pr.status === 'PAID' ? 'default' :
                        pr.status === 'APPROVED' ? 'outline' :
                        pr.status === 'PENDING' ? 'secondary' : 'destructive'
                      }>
                        {pr.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {pr.invoice_number ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs">{pr.invoice_number}</span>
                          <Badge variant="outline" className="text-xs w-fit">{pr.invoice_payment_status}</Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(pr.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(requests as any[]).length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No purchase requests found</div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
