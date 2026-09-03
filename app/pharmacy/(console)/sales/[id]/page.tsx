import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { PageHeading } from '@/components/dashboard/ui'
import { BillView } from '@/components/pharmacy/bill-view'

export const dynamic = 'force-dynamic'

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getPharmacyContext()
  if (!ctx?.id) return null
  const id = Number((await params).id)
  const sale = await prisma.sale.findFirst({
    where: { id, pharmacyId: ctx.id },
    include: { items: true, customer: true, pharmacy: true },
  })
  if (!sale) notFound()

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/pharmacy/sales" className="text-sm text-muted-foreground hover:underline">← Sales</Link>
      </div>
      <PageHeading title={`Bill ${sale.billNumber}`} />
      <BillView sale={sale} />
    </div>
  )
}
