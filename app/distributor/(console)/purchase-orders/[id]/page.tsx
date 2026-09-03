import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { getDistributorContext } from '@/lib/auth'
import { PageHeading, Card } from '@/components/dashboard/ui'
import { OrderView } from '@/components/orders/order-view'
import { OrderActions } from '@/components/orders/order-actions'

export const dynamic = 'force-dynamic'

export default async function DistributorOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getDistributorContext()
  if (!ctx?.id) return null
  const id = Number((await params).id)
  const order = await prisma.purchaseOrder.findFirst({
    where: { id, distributorId: ctx.id },
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
      <Link href="/distributor/purchase-orders" className="text-sm text-muted-foreground hover:underline">← Purchase orders</Link>
      <PageHeading title={order.orderNumber} action={<OrderActions orderId={order.id} status={order.status} role="DISTRIBUTOR" />} />
      {order.invoice ? (
        <Card className="mb-4 p-4 text-sm">
          Invoice <span className="font-medium">{order.invoice.invoiceNumber}</span> generated ·{' '}
          <Link href={`/distributor/purchase-orders/${order.id}/invoice`} className="text-primary hover:underline">
            View invoice
          </Link>
        </Card>
      ) : null}
      <OrderView order={order} />
    </div>
  )
}
