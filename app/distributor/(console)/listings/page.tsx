import Link from 'next/link'

import prisma from '@/lib/prisma'
import { getDistributorContext } from '@/lib/auth'
import { parseListParams } from '@/lib/list-params'
import { PageHeading, Card, EmptyState, StatusBadge, Pagination } from '@/components/dashboard/ui'
import { formatINR } from '@/lib/money'

export const metadata = { title: 'Listings' }
export const dynamic = 'force-dynamic'

export default async function DistributorListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const ctx = await getDistributorContext()
  if (!ctx?.id) return null
  const sp = await searchParams
  const { page, limit, skip, search } = parseListParams(sp, { limit: 25 })

  const where = {
    distributorId: ctx.id,
    ...(search ? { medicine: { name: { contains: search, mode: 'insensitive' as const } } } : {}),
  }
  const [rows, total] = await Promise.all([
    prisma.distributorListing.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: { medicine: { select: { name: true, strength: true, manufacturer: true } } },
    }),
    prisma.distributorListing.count({ where }),
  ])

  return (
    <div>
      <PageHeading
        title="Listings"
        description={`${total} total`}
        action={
          <div className="flex gap-2">
            <Link href="/distributor/listings/bulk" className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
              Bulk upload
            </Link>
            <Link href="/distributor/listings/new" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              New listing
            </Link>
          </div>
        }
      />
      <form className="mb-4" action="/distributor/listings">
        <input name="q" defaultValue={search} placeholder="Search medicine…" className="h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm" />
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No listings yet" message="Add stock so approved pharmacies can order from you." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Medicine</th>
                <th className="px-4 py-2.5">Batch / expiry</th>
                <th className="px-4 py-2.5 text-right">Price</th>
                <th className="px-4 py-2.5 text-right">Available</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((l) => {
                const available = l.quantity - l.reservedQuantity
                const expSoon = l.expiryDate.getTime() < Date.now() + 90 * 864e5
                return (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <Link href={`/distributor/listings/${l.id}`} className="font-medium hover:underline">
                        {l.medicine.name}{l.medicine.strength ? ` ${l.medicine.strength}` : ''}
                      </Link>
                      <div className="text-xs text-muted-foreground">{l.medicine.manufacturer}</div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {l.batchNumber ?? '—'}
                      <div className={expSoon ? 'text-xs text-amber-700' : 'text-xs'}>
                        exp {l.expiryDate.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(l.unitPrice)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {available}
                      {l.reservedQuantity > 0 ? <span className="text-xs text-muted-foreground"> ({l.reservedQuantity} held)</span> : null}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={l.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination basePath="/distributor/listings" page={page} totalPages={Math.max(1, Math.ceil(total / limit))} query={{ q: search }} />
    </div>
  )
}
