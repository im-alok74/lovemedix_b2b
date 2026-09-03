import Link from 'next/link'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { PageHeading } from '@/components/dashboard/ui'
import { SaleForm } from '@/components/pharmacy/sale-form'

export const metadata = { title: 'New bill' }
export const dynamic = 'force-dynamic'

export default async function NewSalePage() {
  const ctx = await getPharmacyContext()
  if (!ctx?.id) return null

  const inventory = await prisma.pharmacyInventory.findMany({
    where: { pharmacyId: ctx.id, isActive: true, quantity: { gt: 0 } },
    orderBy: { updatedAt: 'desc' },
    take: 300,
    include: { medicine: { select: { name: true, strength: true, gstRate: true } } },
  })

  return (
    <div className="max-w-4xl">
      <Link href="/pharmacy/sales" className="text-sm text-muted-foreground hover:underline">← Sales</Link>
      <PageHeading title="Create customer bill" />
      <SaleForm
        inventory={inventory.map((i) => ({
          id: i.id,
          medicineId: i.medicineId,
          label: `${i.medicine.name}${i.medicine.strength ? ` ${i.medicine.strength}` : ''}${i.batchNumber ? ` · ${i.batchNumber}` : ''}`,
          batchNumber: i.batchNumber,
          sellingPrice: Number(i.sellingPrice),
          gstRate: Number(i.medicine.gstRate),
          available: i.quantity,
        }))}
      />
    </div>
  )
}
