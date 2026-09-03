import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { pharmacyId } = await requirePharmacyProfile()
  const id = Number((await params).id)

  if (Number.isNaN(id)) {
    redirect('/pharmacy/inventory')
  }

  const itemRows = await sql`
    SELECT
      pi.id,
      pi.medicine_id,
      pi.batch_number,
      pi.mfg_date,
      pi.expiry_date,
      pi.mrp,
      pi.quantity,
      pi.selling_price,
      pi.discount_percent,
      pi.is_active,
      m.name AS medicine_name
    FROM pharmacy_inventory pi
    JOIN medicines m ON m.id = pi.medicine_id
    WHERE pi.id = ${id} AND pi.pharmacy_id = ${pharmacyId}
    LIMIT 1
  `

  if (!itemRows.length) {
    notFound()
  }

  const item = itemRows[0] as any

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/pharmacy/inventory"><ArrowLeft className="h-4 w-4 mr-2" />Back to Inventory</Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-6">Edit Inventory Item</h1>
          <p className="text-muted-foreground mb-6">{item.medicine_name}</p>

          <form
            action={`/api/pharmacy/inventory/${id}`}
            method="POST"
            className="space-y-6 rounded-lg border border-border bg-card p-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  name="batchNumber"
                  defaultValue={item.batch_number || ''}
                  placeholder="Batch no."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mfgDate">Mfg Date</Label>
                <Input
                  id="mfgDate"
                  name="mfgDate"
                  type="date"
                  defaultValue={item.mfg_date ? new Date(item.mfg_date).toISOString().split('T')[0] : ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
                defaultValue={item.expiry_date ? new Date(item.expiry_date).toISOString().split('T')[0] : ''}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mrp">MRP (₹)</Label>
                <Input
                  id="mrp"
                  name="mrp"
                  type="number"
                  step="0.01"
                  defaultValue={item.mrp}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  defaultValue={item.quantity}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price (₹)</Label>
                <Input
                  id="sellingPrice"
                  name="sellingPrice"
                  type="number"
                  step="0.01"
                  defaultValue={item.selling_price}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPercent">Discount %</Label>
                <Input
                  id="discountPercent"
                  name="discountPercent"
                  type="number"
                  step="0.01"
                  defaultValue={item.discount_percent || 0}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit">Save Changes</Button>
              <Button asChild variant="outline">
                <Link href="/pharmacy/inventory">Cancel</Link>
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
