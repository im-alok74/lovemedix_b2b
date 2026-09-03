import Link from 'next/link'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { parseListParams } from '@/lib/list-params'
import { PageHeading, Card, EmptyState, StatusBadge, Pagination } from '@/components/dashboard/ui'
import { formatINR } from '@/lib/money'

export const metadata = { title: 'Sales & billing' }
export const dynamic = 'force-dynamic'

export default async function PharmacySalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const ctx = await getPharmacyContext()
  if (!ctx?.id) return null
  const sp = await searchParams
  const { page, limit, skip } = parseListParams(sp, { limit: 30 })

  const [rows, total, todaySum] = await Promise.all([
    prisma.sale.findMany({
      where: { pharmacyId: ctx.id },
      orderBy: { billDate: 'desc' },
      skip,
      take: limit,
      include: { customer: { select: { name: true } }, _count: { select: { items: true } } },
    }),
    prisma.sale.count({ where: { pharmacyId: ctx.id } }),
    prisma.sale.aggregate({
      _sum: { totalAmount: true },
      where: { pharmacyId: ctx.id, billDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
  ])

  return (
    <div>
      <PageHeading
        title="Sales & billing"
        description={`${total} bills · ${formatINR(todaySum._sum.totalAmount ?? 0)} today`}
        action={<Link href="/pharmacy/sales/new" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">New bill</Link>}
      />
      {rows.length === 0 ? (
        <EmptyState title="No bills yet" message="Create a customer bill from your inventory." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Bill</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5 text-right">Items</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <Link href={`/pharmacy/sales/${s.id}`} className="font-medium hover:underline">{s.billNumber}</Link>
                    <div className="text-xs text-muted-foreground">{s.billDate.toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-2.5">{s.customer?.name ?? 'Walk-in'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{s._count.items}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(s.totalAmount)}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={s.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination basePath="/pharmacy/sales" page={page} totalPages={Math.max(1, Math.ceil(total / limit))} />
    </div>
  )
}
