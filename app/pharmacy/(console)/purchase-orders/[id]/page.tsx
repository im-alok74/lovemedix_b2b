import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { PageHeading, Card } from '@/components/dashboard/ui'
import { OrderView } from '@/components/orders/order-view'
import { OrderActions } from '@/components/orders/order-actions'
import { ApiAction } from '@/components/dashboard/api-action'

export const dynamic = 'force-dynamic'

export default async function PharmacyOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getPharmacyContext()
  if (!ctx?.id) return null
  const id = Number((await params).id)
  const order = await prisma.purchaseOrder.findFirst({
    where: { id, pharmacyId: ctx.id },
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
      <Link href="/pharmacy/purchase-orders" className="text-sm text-muted-foreground hover:underline">← Purchase orders</Link>
      <PageHeading
        title={order.orderNumber}
        action={
          <div className="flex flex-wrap gap-2">
            <OrderActions orderId={order.id} status={order.status} role="PHARMACY" />
            {order.invoice && order.paymentStatus !== 'PAID' ? (
              <ApiAction
                endpoint={`/api/pharmacy/purchase-orders/${order.id}`}
                body={{ markPaid: true, paymentMethod: 'Bank transfer' }}
                label="Mark as paid"
                variant="primary"
                confirm="Mark this order as paid to the distributor?"
              />
            ) : null}
          </div>
        }
      />
      {order.invoice ? (
        <Card className="mb-4 p-4 text-sm">
          Invoice <span className="font-medium">{order.invoice.invoiceNumber}</span> ·{' '}
          <Link href={`/pharmacy/purchase-orders/${order.id}/invoice`} className="text-primary hover:underline">View invoice</Link>
        </Card>
      ) : null}
      <OrderView order={order} />
    </div>
  )
}
