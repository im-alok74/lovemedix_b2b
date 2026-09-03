'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, XCircle, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface OutOfStockRequest {
  id: number
  medicine_name: string
  generic_name?: string
  manufacturer?: string
  distributor_name: string
  requested_quantity: number
  status: string
  created_at: string
  fulfilled_at?: string
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
  FULFILLED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="w-4 h-4" /> },
  CANCELLED: { color: 'bg-gray-100 text-gray-800', icon: <XCircle className="w-4 h-4" /> },
}

export function PharmacyOutOfStockRequests() {
  const [requests, setRequests] = useState<OutOfStockRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const url = filter === 'all'
        ? '/api/pharmacy/out-of-stock-requests?limit=10&page=1'
        : `/api/pharmacy/out-of-stock-requests?status=${filter}&limit=10&page=1`
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setRequests(data.items || [])
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to load requests', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this request?')) return
    try {
      const res = await fetch(`/api/pharmacy/out-of-stock-requests/${id}/cancel`, { method: 'POST' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Request cancelled' })
        fetchRequests()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to cancel', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Loading requests...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Out of Stock Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="FULFILLED">Fulfilled</TabsTrigger>
            <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 opacity-50" />
                <p>No requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                    {requests.map((req) => (
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
                            <Button size="sm" variant="destructive" onClick={() => handleCancel(req.id)}>
                              Cancel
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
