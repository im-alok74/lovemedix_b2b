'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useToast } from '@/hooks/use-toast'
import { Receipt } from 'lucide-react'

interface Invoice {
  id: number
  invoice_number: string
  invoice_date: string
  due_date?: string
  total_amount: number
  payment_status: string
  paid_at?: string
  payment_method?: string
  transaction_ref?: string
  distributor_name: string
}

export function BillingManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/pharmacy/billing', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setInvoices(data.invoices || [])
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to load invoices', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Loading invoices...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No invoices yet</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Distributor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.distributor_name}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(inv.invoice_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>₹{Number(inv.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        inv.payment_status === 'PAID' ? 'default' :
                        inv.payment_status === 'PARTIAL' ? 'secondary' :
                        inv.payment_status === 'FAILED' ? 'destructive' : 'outline'
                      }>
                        {inv.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{inv.payment_method || '-'}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <a href={`/api/pharmacy/purchase-requests/${inv.purchase_request_id}/invoice`} target="_blank" rel="noopener noreferrer">
                          <Receipt className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
