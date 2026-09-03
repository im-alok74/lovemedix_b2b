'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Edit2, AlertCircle, Plus } from 'lucide-react'
import Link from 'next/link'

interface InventoryItem {
  id: number
  medicine_name: string
  generic_name?: string
  manufacturer?: string
  images?: string[]
  photo_url?: string
  batch_number?: string
  expiry_date?: string
  quantity: number
  selling_price: number
  discount_percent: number
  mrp?: number
  is_active: boolean
}

export function PharmacyInventoryList() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchItems = async (pageNum = 1) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/pharmacy/inventory?page=${pageNum}&limit=10`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setItems(data.items || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setPage(pageNum)
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to load inventory', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems(1)
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this item?')) return
    try {
      const res = await fetch(`/api/pharmacy/inventory/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Item removed' })
        fetchItems(page)
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to remove', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    }
  }

  const isExpired = (date?: string) => date ? new Date(date) < new Date() : false
  const isExpiringSoon = (date?: string) => {
    if (!date) return false
    const expiry = new Date(date).getTime()
    const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime()
    return expiry < soon && !isExpired(date)
  }

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Loading inventory...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Inventory ({items.length})</CardTitle>
        <Button asChild size="sm">
          <Link href="/pharmacy/inventory/add"><Plus className="h-4 w-4 mr-1" />Add</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No items in inventory</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {(item.images?.[0] || item.medicine_image) ? (
                            <img
                              src={item.images?.[0] || item.medicine_image}
                              alt={item.medicine_name}
                              className="h-10 w-10 rounded-md border object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                            />
                          ) : null}
                          <div>
                            <div>{item.medicine_name}</div>
                            <div className="text-[11px] text-muted-foreground">{item.generic_name || item.manufacturer || ''}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.batch_number || '-'}</TableCell>
                      <TableCell className={Number(item.quantity) === 0 ? 'text-red-600 font-semibold' : ''}>
                        {item.quantity}
                      </TableCell>
                      <TableCell>₹{Number(item.selling_price).toFixed(2)}</TableCell>
                      <TableCell>{Number(item.discount_percent || 0).toFixed(0)}%</TableCell>
                      <TableCell>
                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {isExpired(item.expiry_date) ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : isExpiringSoon(item.expiry_date) ? (
                          <Badge className="bg-yellow-500">Expiring Soon</Badge>
                        ) : (
                          <Badge variant={item.is_active ? 'default' : 'secondary'}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/pharmacy/inventory/${item.id}/edit`}>
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchItems(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => fetchItems(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
