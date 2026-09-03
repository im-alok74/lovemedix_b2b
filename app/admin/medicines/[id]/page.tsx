import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { PageHeading, Card } from '@/components/dashboard/ui'
import { MedicineForm } from '@/components/admin/medicine-form'
import { ApiAction } from '@/components/dashboard/api-action'

export const dynamic = 'force-dynamic'

export default async function EditMedicinePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()

  const [medicine, categories] = await Promise.all([
    prisma.medicine.findUnique({ where: { id } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' }, select: { id: true, name: true } }),
  ])
  if (!medicine) notFound()

  return (
    <div className="max-w-3xl">
      <Link href="/admin/medicines" className="text-sm text-muted-foreground hover:underline">← Catalog</Link>
      <PageHeading
        title={medicine.name}
        action={
          <ApiAction
            endpoint={`/api/admin/medicines/${id}`}
            method="DELETE"
            label="Delete / retire"
            variant="danger"
            confirm="Delete this medicine? It is retired instead if it has stock or orders."
            redirectTo="/admin/medicines"
          />
        }
      />
      <Card className="p-5">
        <MedicineForm
          categories={categories}
          initial={{
            id: medicine.id,
            name: medicine.name,
            genericName: medicine.genericName ?? '',
            manufacturer: medicine.manufacturer ?? '',
            categoryId: medicine.categoryId ? String(medicine.categoryId) : '',
            form: medicine.form ?? '',
            strength: medicine.strength ?? '',
            packSize: medicine.packSize ?? '',
            hsnCode: medicine.hsnCode ?? '',
            mrp: String(medicine.mrp),
            gstRate: String(medicine.gstRate),
            requiresPrescription: medicine.requiresPrescription,
            status: medicine.status,
            photoUrl: medicine.photoUrl ?? '',
            description: medicine.description ?? '',
          }}
        />
      </Card>
    </div>
  )
}
