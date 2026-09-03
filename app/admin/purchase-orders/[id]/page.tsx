import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { PageHeading } from '@/components/dashboard/ui'
import { OrderView } from '@/components/orders/order-view'

export const dynamic = 'force-dynamic'

export default async function AdminPurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      items: { include: { medicine: true } },
      events: { orderBy: { createdAt: 'asc' } },
      pharmacy: true,
      distributor: true,
      invoice: true,
    },
  })
  if (!order) notFound()

  return (
    <div className="max-w-4xl">
      <Link href="/admin/purchase-orders" className="text-sm text-muted-foreground hover:underline">← All purchase orders</Link>
      <PageHeading title={order.orderNumber} description="Read-only admin view of a marketplace order." />
      <OrderView order={order} />
    </div>
  )
}
