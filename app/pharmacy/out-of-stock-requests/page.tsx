import { redirect } from 'next/navigation'
import { useState } from 'react'
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
import { AlertCircle, XCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react'

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
  FULFILLED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="w-4 h-4" /> },
  CANCELLED: { color: 'bg-gray-100 text-gray-800', icon: <XCircle className="w-4 h-4" /> },
}

function CancelRequestButton({ requestId }: { requestId: number }) {
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Cancel this request?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/pharmacy/out-of-stock-requests/${requestId}/cancel`, { method: 'POST' })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to cancel')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" variant="destructive" onClick={handleCancel} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel'}
    </Button>
  )
}

export default async function PharmacyOutOfStockRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { pharmacyId } = await requirePharmacyProfile()
  const params = await searchParams
  const status = params.status || ''

  const requests = await sql`
    SELECT
      osr.id,
      osr.requested_quantity,
      osr.mrp,
      osr.unit_price,
      osr.status,
      osr.notes,
      osr.fulfilled_at,
      osr.created_at,
      m.name AS medicine_name,
      m.generic_name,
      m.manufacturer,
      dp.company_name AS distributor_name
    FROM out_of_stock_requests osr
    JOIN medicines m ON m.id = osr.medicine_id
    JOIN distributor_profiles dp ON dp.id = osr.distributor_id
    WHERE osr.pharmacy_id = ${pharmacyId}
      ${status ? sql`AND osr.status = ${status}` : sql``}
    ORDER BY osr.created_at DESC
    LIMIT 50
  `

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">Out of Stock Requests</h1>

          <div className="mb-6 flex gap-2">
            <Button asChild variant={status === '' ? 'default' : 'outline'}>
              <Link href="/pharmacy/out-of-stock-requests">All</Link>
            </Button>
            {['PENDING', 'FULFILLED', 'CANCELLED'].map((s) => (
              <Button key={s} asChild variant={status === s ? 'default' : 'outline'}>
                <Link href={`/pharmacy/out-of-stock-requests?status=${s}`}>{s}</Link>
              </Button>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Distributor</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(requests as any[]).map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{req.medicine_name}</div>
                        <div className="text-xs text-muted-foreground">{req.generic_name} {req.manufacturer}</div>
                      </div>
                    </TableCell>
                    <TableCell>{req.distributor_name}</TableCell>
                    <TableCell>{req.requested_quantity}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig[req.status]?.color || 'bg-gray-100'}>
                        <span className="flex items-center gap-1">
                          {statusConfig[req.status]?.icon}
                          {req.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(req.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {req.status === 'PENDING' ? (
                        <CancelRequestButton requestId={req.id} />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(requests as any[]).length === 0 && (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 opacity-50" />
                <p>No out of stock requests yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
