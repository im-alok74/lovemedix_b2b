import Link from 'next/link'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { parseListParams } from '@/lib/list-params'
import { PageHeading, Card, EmptyState, Pagination } from '@/components/dashboard/ui'
import { formatINR } from '@/lib/money'

export const metadata = { title: 'Customers' }
export const dynamic = 'force-dynamic'

export default async function PharmacyCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const ctx = await getPharmacyContext()
  if (!ctx?.id) return null
  const sp = await searchParams
  const { page, limit, skip, search } = parseListParams(sp, { limit: 30 })

  const where = {
    pharmacyId: ctx.id,
    ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { phone: { contains: search } }] } : {}),
  }
  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: { _count: { select: { sales: true } }, sales: { select: { totalAmount: true } } },
    }),
    prisma.customer.count({ where }),
  ])

  return (
    <div>
      <PageHeading
        title="Customers"
        description={`${total} total`}
        action={<Link href="/pharmacy/customers/new" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Add customer</Link>}
      />
      <form className="mb-4" action="/pharmacy/customers">
        <input name="q" defaultValue={search} placeholder="Search name or phone…" className="h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm" />
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No customers yet" />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5 text-right">Bills</th>
                <th className="px-4 py-2.5 text-right">Lifetime value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5"><Link href={`/pharmacy/customers/${c.id}`} className="font-medium hover:underline">{c.name}</Link></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.phone ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c._count.sales}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatINR(c.sales.reduce((s, x) => s + Number(x.totalAmount), 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination basePath="/pharmacy/customers" page={page} totalPages={Math.max(1, Math.ceil(total / limit))} query={{ q: search }} />
    </div>
  )
}
