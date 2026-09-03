import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { PageHeading, Card } from '@/components/dashboard/ui'
import { InventoryForm } from '@/components/pharmacy/inventory-form'
import { ApiAction } from '@/components/dashboard/api-action'

export const dynamic = 'force-dynamic'

export default async function EditInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getPharmacyContext()
  if (!ctx?.id) return null
  const id = Number((await params).id)
  const row = await prisma.pharmacyInventory.findFirst({
    where: { id, pharmacyId: ctx.id },
    include: { medicine: { select: { name: true, strength: true } } },
  })
  if (!row) notFound()
  const d = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : '')

  return (
    <div className="max-w-2xl">
      <Link href="/pharmacy/inventory" className="text-sm text-muted-foreground hover:underline">← Inventory</Link>
      <PageHeading
        title="Edit stock"
        action={
          <ApiAction endpoint={`/api/pharmacy/inventory/${id}`} method="DELETE" label="Delete" variant="danger" confirm="Delete this inventory line?" redirectTo="/pharmacy/inventory" />
        }
      />
      <Card className="p-5">
        <InventoryForm
          initial={{
            id: row.id,
            medicineId: row.medicineId,
            medicineLabel: `${row.medicine.name}${row.medicine.strength ? ` ${row.medicine.strength}` : ''}`,
            batchNumber: row.batchNumber ?? '',
            mfgDate: d(row.mfgDate),
            expiryDate: d(row.expiryDate),
            mrp: String(row.mrp),
            costPrice: String(row.costPrice),
            sellingPrice: String(row.sellingPrice),
            quantity: String(row.quantity),
            reorderLevel: String(row.reorderLevel),
          }}
        />
      </Card>
    </div>
  )
}
