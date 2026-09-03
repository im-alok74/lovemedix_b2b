'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Customer {
  id: number
  full_name: string
  email: string
  phone?: string
  address?: string
  notes?: string
  total_orders: number
  total_spent: number
  last_order_at?: string
}

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/pharmacy/customers', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setCustomers(data.customers || [])
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to load customers', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filtered = customers.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone || '').includes(q)
  })

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Loading customers...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Customers</CardTitle>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button><Plus className="h-4 w-4 mr-1" />Add</Button>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No customers found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.full_name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone || '-'}</TableCell>
                    <TableCell>{c.total_orders}</TableCell>
                    <TableCell>₹{Number(c.total_spent).toFixed(2)}</TableCell>
                    <TableCell className="text-sm">
                      {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : '-'}
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
