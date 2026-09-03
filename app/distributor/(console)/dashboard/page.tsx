import prisma from '@/lib/prisma'
import { resolveDashboardGate } from '@/lib/auth'
import { PageHeading, StatCard, Card, EmptyState, StatusBadge } from '@/components/dashboard/ui'
import { formatINR } from '@/lib/money'
import Link from 'next/link'

export const metadata = { title: 'Overview' }
export const dynamic = 'force-dynamic'

export default async function DistributorDashboard() {
  const gate = await resolveDashboardGate('DISTRIBUTOR')
  if (gate.state !== 'ok') return null
  const distributorId = gate.profileId
  const soon = new Date(Date.now() + 90 * 24 * 3600 * 1000)

  const [activeListings, lowStock, expiring, pendingOrders, revenue, recentOrders] = await Promise.all([
    prisma.distributorListing.count({ where: { distributorId, isActive: true } }),
    prisma.distributorListing.count({ where: { distributorId, isActive: true, quantity: { lte: 10 } } }),
    prisma.distributorListing.count({ where: { distributorId, isActive: true, expiryDate: { lte: soon } } }),
    prisma.purchaseOrder.count({ where: { distributorId, status: 'PENDING' } }),
    prisma.purchaseOrder.aggregate({ _sum: { totalAmount: true }, where: { distributorId, status: { in: ['SHIPPED', 'DELIVERED'] } } }),
    prisma.purchaseOrder.findMany({
      where: { distributorId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, orderNumber: true, status: true, totalAmount: true, pharmacy: { select: { pharmacyName: true } } },
    }),
  ])

  return (
    <div>
      <PageHeading title="Distributor overview" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active listings" value={activeListings} href="/distributor/listings" />
        <StatCard label="Low stock (≤10)" value={lowStock} href="/distributor/listings" />
        <StatCard label="Expiring ≤90 days" value={expiring} href="/distributor/listings" />
        <StatCard label="Orders awaiting you" value={pendingOrders} href="/distributor/purchase-orders?status=PENDING" />
        <StatCard label="Fulfilled revenue" value={formatINR(revenue._sum.totalAmount ?? 0)} />
      </div>

      <Card className="mt-6 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent orders</h2>
          <Link href="/distributor/purchase-orders" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <EmptyState title="No orders yet" message="Add listings so pharmacies can order from you." />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2">
                <Link href={`/distributor/purchase-orders/${o.id}`} className="hover:underline">
                  <span className="font-medium">{o.orderNumber}</span>
                  <span className="ml-2 text-muted-foreground">{o.pharmacy.pharmacyName}</span>
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
