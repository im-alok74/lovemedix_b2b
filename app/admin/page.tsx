import Link from 'next/link'

import prisma from '@/lib/prisma'
import { PageHeading, StatCard, Card, EmptyState } from '@/components/dashboard/ui'
import { StatusBadge } from '@/components/dashboard/ui'
import { formatINR } from '@/lib/money'

export const metadata = { title: 'Overview' }

export default async function AdminOverviewPage() {
  const [
    pharmaciesPending,
    distributorsPending,
    documentsPending,
    medicines,
    openRequests,
    ordersToday,
    gmv,
    recentPharmacies,
    recentOrders,
  ] = await Promise.all([
    prisma.pharmacyProfile.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.distributorProfile.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.document.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.medicine.count({ where: { status: 'ACTIVE' } }),
    prisma.medicineRequest.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.purchaseOrder.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.purchaseOrder.aggregate({ _sum: { totalAmount: true }, where: { status: { not: 'CANCELLED' } } }),
    prisma.pharmacyProfile.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: { id: true, pharmacyName: true, city: true, state: true, verificationStatus: true, createdAt: true },
    }),
    prisma.purchaseOrder.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        pharmacy: { select: { pharmacyName: true } },
        distributor: { select: { companyName: true } },
      },
    }),
  ])

  return (
    <div>
      <PageHeading title="Platform overview" description="Approvals, catalog and marketplace activity at a glance." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pharmacies pending" value={pharmaciesPending} href="/admin/pharmacies?status=PENDING" />
        <StatCard label="Distributors pending" value={distributorsPending} href="/admin/distributors?status=PENDING" />
        <StatCard label="Documents to review" value={documentsPending} href="/admin/documents" />
        <StatCard label="Active medicines" value={medicines} href="/admin/medicines" />
        <StatCard label="Open medicine requests" value={openRequests} href="/admin/medicine-requests" />
        <StatCard label="Purchase orders today" value={ordersToday} href="/admin/purchase-orders" />
        <StatCard label="Lifetime GMV" value={formatINR(gmv._sum.totalAmount ?? 0)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Newest pharmacies</h2>
            <Link href="/admin/pharmacies" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentPharmacies.length === 0 ? (
            <EmptyState title="No pharmacies yet" />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {recentPharmacies.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <Link href={`/admin/pharmacies/${p.id}`} className="hover:underline">
                    <span className="font-medium">{p.pharmacyName}</span>
                    <span className="ml-2 text-muted-foreground">{p.city}, {p.state}</span>
                  </Link>
                  <StatusBadge status={p.verificationStatus} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent purchase orders</h2>
            <Link href="/admin/purchase-orders" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2">
                  <Link href={`/admin/purchase-orders/${o.id}`} className="hover:underline">
                    <span className="font-medium">{o.orderNumber}</span>
                    <span className="ml-2 text-muted-foreground">
                      {o.pharmacy.pharmacyName} ← {o.distributor.companyName}
                    </span>
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
    </div>
  )
}
