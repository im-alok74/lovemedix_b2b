import Link from 'next/link'
import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { parseListParams } from '@/lib/list-params'
import { PageHeading, Card, EmptyState, StatusBadge, Pagination } from '@/components/dashboard/ui'
import { formatINR } from '@/lib/money'

export const metadata = { title: 'Purchase orders' }
export const dynamic = 'force-dynamic'

const TABS = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

export default async function PharmacyPurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const ctx = await getPharmacyContext()
  if (!ctx?.id) return null
  const sp = await searchParams
  const { page, limit, skip, status } = parseListParams(sp, { limit: 25 })
  const where: Prisma.PurchaseOrderWhereInput = {
    pharmacyId: ctx.id,
    ...(status && status !== 'ALL' ? { status: status as Prisma.EnumPurchaseOrderStatusFilter['equals'] } : {}),
  }
  const [rows, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true, orderNumber: true, status: true, paymentStatus: true, totalAmount: true, createdAt: true,
        distributor: { select: { companyName: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.purchaseOrder.count({ where }),
  ])

  return (
    <div>
      <PageHeading
        title="Purchase orders"
        description={`${total} total`}
        action={<Link href="/pharmacy/catalog" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">New order</Link>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t} href={`/pharmacy/purchase-orders?status=${t}`} className={`rounded-md border px-3 py-1.5 text-sm ${(status || 'ALL') === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
            {t.toLowerCase()}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No purchase orders" />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Order</th>
                <th className="px-4 py-2.5">Distributor</th>
                <th className="px-4 py-2.5 text-right">Items</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5">Payment</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <Link href={`/pharmacy/purchase-orders/${o.id}`} className="font-medium hover:underline">{o.orderNumber}</Link>
                    <div className="text-xs text-muted-foreground">{o.createdAt.toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-2.5">{o.distributor.companyName}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{o._count.items}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(o.totalAmount)}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={o.paymentStatus} /></td>
                  <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination basePath="/pharmacy/purchase-orders" page={page} totalPages={Math.max(1, Math.ceil(total / limit))} query={{ status }} />
    </div>
  )
}
