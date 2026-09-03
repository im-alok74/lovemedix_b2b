import Link from 'next/link'

import prisma from '@/lib/prisma'
import { PageHeading, Card } from '@/components/dashboard/ui'
import { MedicineForm } from '@/components/admin/medicine-form'

export const metadata = { title: 'New medicine' }
export const dynamic = 'force-dynamic'

export default async function NewMedicinePage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true },
  })
  return (
    <div className="max-w-3xl">
      <Link href="/admin/medicines" className="text-sm text-muted-foreground hover:underline">← Catalog</Link>
      <PageHeading title="Add medicine" />
      <Card className="p-5">
        <MedicineForm categories={categories} />
      </Card>
    </div>
  )
}
