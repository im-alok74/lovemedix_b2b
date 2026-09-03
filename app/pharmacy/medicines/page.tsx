import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function PharmacyMedicinesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>
}) {
  const { pharmacyId } = await requirePharmacyProfile()
  const params = await searchParams
  const search = params.search || ''
  const category = params.category || ''

  const where: string[] = ["m.status = 'ACTIVE'"]
  if (search) {
    where.push(`(m.name ILIKE '%${search.replace(/'/g, "''")}%' OR m.generic_name ILIKE '%${search.replace(/'/g, "''")}%')`)
  }
  if (category) {
    where.push(`m.category_id = ${category}`)
  }
  const whereSql = where.join(' AND ')

  const medicines = await sql`
    SELECT
      m.id,
      m.name,
      m.generic_name,
      m.manufacturer,
      m.form,
      m.strength,
      m.pack_size,
      m.mrp,
      m.photo_url,
      c.name AS category_name,
      COALESCE(
        json_agg(mi.image_url) FILTER (WHERE mi.image_url IS NOT NULL),
        '[]'
      ) AS images
    FROM medicines m
    LEFT JOIN categories c ON c.id = m.category_id
    LEFT JOIN medicine_images mi ON mi.medicine_id = m.id
    WHERE ${sql.unsafe(whereSql)}
    GROUP BY m.id, c.id
    ORDER BY m.name ASC
    LIMIT 50
  `

  const categories = await sql`
    SELECT id, name FROM categories WHERE is_active = true ORDER BY display_order ASC, name ASC
  `

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Medicine Catalog</h1>
              <p className="text-muted-foreground mt-1">Browse available medicines and add to your inventory</p>
            </div>
            <Button asChild>
              <Link href="/pharmacy/medicines/add">
                <Plus className="mr-2 h-4 w-4" />
                Add to Inventory
              </Link>
            </Button>
          </div>

          <div className="mb-6 flex gap-4">
            <form action="/pharmacy/medicines" method="get" className="flex-1 flex gap-2">
              <Input
                name="search"
                placeholder="Search medicines..."
                defaultValue={search}
                className="max-w-sm"
              />
              <Button type="submit" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <form action="/pharmacy/medicines" method="get" className="flex gap-2">
              <select
                name="category"
                defaultValue={category}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                {(categories as any[]).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Button type="submit" variant="outline">Filter</Button>
            </form>
          </div>

          <div className="rounded-lg border border-border bg-card">
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
                {(medicines as any[]).map((med) => (
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
                          <div className="text-xs text-muted-foreground">{med.generic_name}</div>
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
        </div>
      </main>
      <Footer />
    </div>
  )
}
