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
import { ShoppingCart, Plus } from 'lucide-react'

export default async function PharmacyMedicineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { pharmacyId } = await requirePharmacyProfile()
  const id = Number((await params).id)

  if (Number.isNaN(id)) {
    redirect('/pharmacy/medicines')
  }

  const medicineRows = await sql`
    SELECT
      m.id,
      m.name,
      m.generic_name,
      m.manufacturer,
      m.form,
      m.strength,
      m.pack_size,
      m.mrp,
      m.gst_rate,
      m.requires_prescription,
      m.photo_url,
      m.description,
      m.slug,
      c.name AS category_name,
      COALESCE(
        json_agg(mi.image_url) FILTER (WHERE mi.image_url IS NOT NULL),
        '[]'
      ) AS images
    FROM medicines m
    LEFT JOIN categories c ON c.id = m.category_id
    LEFT JOIN medicine_images mi ON mi.medicine_id = m.id
    WHERE m.id = ${id} AND m.status = 'ACTIVE'
    GROUP BY m.id, c.id
    LIMIT 1
  `

  if (!medicineRows.length) {
    redirect('/pharmacy/medicines')
  }

  const medicine = medicineRows[0] as any

  const listings = await sql`
    SELECT
      dm.id AS distributor_medicine_id,
      dm.unit_price,
      dm.quantity,
      dm.reserved_quantity,
      (dm.quantity - dm.reserved_quantity) AS available_quantity,
      dm.batch_number,
      dm.expiry_date,
      dp.company_name AS distributor_name,
      dp.city AS distributor_city,
      dp.state AS distributor_state
    FROM distributor_medicines dm
    JOIN distributor_profiles dp ON dp.id = dm.distributor_id
    WHERE dm.medicine_id = ${id}
      AND dm.is_active = true
      AND dm.quantity > dm.reserved_quantity
      AND dp.verification_status = 'VERIFIED'
    ORDER BY dm.unit_price ASC
  `

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button asChild variant="ghost" className="mb-4">
              <Link href="/pharmacy/medicines">&larr; Back to Catalog</Link>
            </Button>
            <div className="flex items-start gap-6">
              {medicine.images?.[0] || medicine.photo_url ? (
                <img
                  src={medicine.images?.[0] || medicine.photo_url}
                  alt={medicine.name}
                  className="h-32 w-32 rounded-lg border object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              ) : null}
              <div>
                <h1 className="text-3xl font-bold text-foreground">{medicine.name}</h1>
                <p className="text-muted-foreground mt-1">{medicine.generic_name}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {medicine.category_name && <Badge variant="outline">{medicine.category_name}</Badge>}
                  {medicine.form && <Badge variant="outline">{medicine.form}</Badge>}
                  {medicine.strength && <Badge variant="outline">{medicine.strength}</Badge>}
                  {medicine.pack_size && <Badge variant="outline">{medicine.pack_size}</Badge>}
                  {medicine.requires_prescription && <Badge variant="destructive">Rx Required</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-3">{medicine.description}</p>
                <div className="mt-3 text-sm">
                  <span className="text-muted-foreground">MRP: </span>
                  <span className="font-semibold">₹{Number(medicine.mrp).toFixed(2)}</span>
                  <span className="text-muted-foreground ml-4">GST: </span>
                  <span className="font-semibold">{Number(medicine.gst_rate).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Distributor Listings</h2>
            {listings.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">No verified distributors currently listing this medicine.</p>
                <Button asChild className="mt-4">
                  <Link href="/pharmacy/procurement">Browse Procurement Marketplace</Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Distributor</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(listings as any[]).map((l: any) => (
                      <TableRow key={l.distributor_medicine_id}>
                        <TableCell className="font-medium">{l.distributor_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {[l.distributor_city, l.distributor_state].filter(Boolean).join(', ')}
                        </TableCell>
                        <TableCell className="text-sm">{l.batch_number || '-'}</TableCell>
                        <TableCell className="text-sm">{new Date(l.expiry_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={l.available_quantity > 0 ? 'outline' : 'secondary'}>
                            {l.available_quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">₹{Number(l.unit_price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/pharmacy/medicines/add?medicineId=${medicine.id}&distributorMedicineId=${l.distributor_medicine_id}`}>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
