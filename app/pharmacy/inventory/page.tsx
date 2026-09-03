import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function PharmacyInventoryPage() {
  const { pharmacyId } = await requirePharmacyProfile()

  const profile = await sql`
    SELECT * FROM pharmacy_profiles WHERE user_id IN (SELECT user_id FROM pharmacy_profiles WHERE id = ${pharmacyId}) LIMIT 1
  `
  if (!profile.length) {
    redirect('/pharmacy/register')
  }

  const inventory = await sql`
    SELECT
      pi.id,
      m.name AS medicine_name,
      m.generic_name,
      m.manufacturer,
      m.photo_url AS medicine_image,
      pi.batch_number,
      pi.quantity,
      pi.selling_price,
      pi.discount_percent,
      pi.mrp,
      pi.expiry_date,
      pi.is_active,
      pi.created_at,
      pi.updated_at
    FROM pharmacy_inventory pi
    JOIN medicines m ON m.id = pi.medicine_id
    WHERE pi.pharmacy_id = ${pharmacyId}
    ORDER BY pi.updated_at DESC
  `

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <Button asChild>
              <Link href="/pharmacy/inventory/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Medicine
              </Link>
            </Button>
          </div>

          {inventory.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No medicines in your inventory yet.</p>
              <Button asChild className="mt-4">
                <Link href="/pharmacy/medicines">Browse Catalog</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card">
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
                  {(inventory as any[]).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{item.medicine_name}</div>
                          <div className="text-xs text-muted-foreground">{item.generic_name || item.manufacturer}</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.batch_number || '-'}</TableCell>
                      <TableCell>
                        <span className={Number(item.quantity) === 0 ? 'text-red-600 font-semibold' : ''}>
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell>₹{Number(item.selling_price).toFixed(2)}</TableCell>
                      <TableCell>{Number(item.discount_percent || 0).toFixed(0)}%</TableCell>
                      <TableCell>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/pharmacy/inventory/${item.id}/edit`}>Edit</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
