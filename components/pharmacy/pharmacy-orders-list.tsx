'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

interface Order {
  id: number
  order_number: string
  distributor_name: string
  order_status: string
  payment_status: string
  total_amount: string
  created_at: string
  item_count: number
}

export function PharmacyOrdersList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const url = filter === 'all'
        ? '/api/pharmacy/orders?limit=10&page=1'
        : `/api/pharmacy/orders?status=${filter}&limit=10&page=1`
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setOrders(data.items || [])
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to load orders', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading orders...</div>
  }

  return (
    <Tabs value={filter} onValueChange={setFilter}>
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="PENDING">Pending</TabsTrigger>
        <TabsTrigger value="CONFIRMED">Confirmed</TabsTrigger>
        <TabsTrigger value="PROCESSING">Processing</TabsTrigger>
        <TabsTrigger value="SHIPPED">Shipped</TabsTrigger>
        <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
        <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
      </TabsList>

      <TabsContent value={filter} className="mt-6">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
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
                {orders.map((order) => (
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
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
