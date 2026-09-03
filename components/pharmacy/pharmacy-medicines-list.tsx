'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface MedicineCatalogItem {
  id: number
  name: string
  generic_name?: string
  manufacturer?: string
  form?: string
  strength?: string
  pack_size?: string
  mrp: number
  photo_url?: string
  category_name?: string
  images?: string[]
  distributor_listings?: any[]
}

export function PharmacyMedicinesList() {
  const [medicines, setMedicines] = useState<MedicineCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchMedicines = async (pageNum = 1) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/pharmacy/medicines?limit=10&page=${pageNum}`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setMedicines(data.items || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setPage(pageNum)
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to load medicines', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMedicines(1)
  }, [])

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Loading medicines...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Medicine Catalog</CardTitle>
        <Button asChild size="sm">
          <Link href="/pharmacy/medicines/add"><Plus className="h-4 w-4 mr-1" />Add to Inventory</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {medicines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No medicines found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead>MRP</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {med.images?.[0] || med.photo_url ? (
                            <img
                              src={med.images?.[0] || med.photo_url}
                              alt={med.name}
                              className="h-10 w-10 rounded-md border object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                            />
                          ) : null}
                          <div>
                            <div>{med.name}</div>
                            <div className="text-[11px] text-muted-foreground">{med.generic_name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{med.category_name || '-'}</TableCell>
                      <TableCell>{med.form || '-'}</TableCell>
                      <TableCell>{med.strength || '-'}</TableCell>
                      <TableCell>₹{Number(med.mrp).toFixed(2)}</TableCell>
                      <TableCell>{med.manufacturer || '-'}</TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/pharmacy/medicines/${med.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchMedicines(page - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchMedicines(page + 1)}>
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
