import Link from 'next/link'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { PageHeading, StatCard, Card, EmptyState, StatusBadge } from '@/components/dashboard/ui'
import { formatINR } from '@/lib/money'

export const metadata = { title: 'Overview' }
export const dynamic = 'force-dynamic'

export default async function PharmacyDashboard() {
  const ctx = await getPharmacyContext()
  if (!ctx?.id) return null
  const pharmacyId = ctx.id
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0))
  const soon = new Date(Date.now() + 30 * 864e5)

  const [openOrders, openRequests, lowStock, expiring, salesToday, recentOrders] = await Promise.all([
    prisma.purchaseOrder.count({ where: { pharmacyId, status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] } } }),
    prisma.medicineRequest.count({ where: { pharmacyId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.pharmacyInventory.count({ where: { pharmacyId, isActive: true, quantity: { lte: prisma.pharmacyInventory.fields.reorderLevel } } }),
    prisma.pharmacyInventory.count({ where: { pharmacyId, isActive: true, expiryDate: { lte: soon, not: null } } }),
    prisma.sale.aggregate({ _sum: { totalAmount: true }, _count: true, where: { pharmacyId, billDate: { gte: startOfDay } } }),
    prisma.purchaseOrder.findMany({
      where: { pharmacyId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, orderNumber: true, status: true, totalAmount: true, distributor: { select: { companyName: true } } },
    }),
  ])

  return (
    <div>
      <PageHeading title="Pharmacy overview" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Open purchase orders" value={openOrders} href="/pharmacy/purchase-orders" />
        <StatCard label="Open requests" value={openRequests} href="/pharmacy/requests" />
        <StatCard label="Low stock" value={lowStock} href="/pharmacy/inventory" />
        <StatCard label="Expiring ≤30 days" value={expiring} href="/pharmacy/inventory" />
        <StatCard label="Sales today" value={formatINR(salesToday._sum.totalAmount ?? 0)} hint={`${salesToday._count} bills`} href="/pharmacy/sales" />
      </div>

      <Card className="mt-6 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent purchase orders</h2>
          <Link href="/pharmacy/catalog" className="text-xs text-primary hover:underline">Browse catalog →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <EmptyState title="No orders yet" message="Browse the catalog to place your first bulk order." />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2">
                <Link href={`/pharmacy/purchase-orders/${o.id}`} className="hover:underline">
                  <span className="font-medium">{o.orderNumber}</span>
                  <span className="ml-2 text-muted-foreground">{o.distributor.companyName}</span>
                </Link>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums">{formatINR(o.totalAmount)}</span>
                  <StatusBadge status={o.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
