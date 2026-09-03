import Link from 'next/link'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { parseListParams } from '@/lib/list-params'
import { PageHeading, Card, EmptyState, Pagination } from '@/components/dashboard/ui'
import { formatINR } from '@/lib/money'

export const metadata = { title: 'Inventory' }
export const dynamic = 'force-dynamic'

export default async function PharmacyInventoryPage({
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
    ...(search ? { medicine: { name: { contains: search, mode: 'insensitive' as const } } } : {}),
  }
  const [rows, total] = await Promise.all([
    prisma.pharmacyInventory.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
      skip,
      take: limit,
      include: { medicine: { select: { name: true, strength: true } } },
    }),
    prisma.pharmacyInventory.count({ where }),
  ])

  return (
    <div>
      <PageHeading
        title="Inventory"
        description={`${total} lines`}
        action={<Link href="/pharmacy/inventory/new" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Add stock</Link>}
      />
      <form className="mb-4" action="/pharmacy/inventory">
        <input name="q" defaultValue={search} placeholder="Search medicine…" className="h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm" />
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No inventory yet" message="Add stock manually, or it builds up as you receive purchase orders." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Medicine</th>
                <th className="px-4 py-2.5">Batch / expiry</th>
                <th className="px-4 py-2.5 text-right">Qty</th>
                <th className="px-4 py-2.5 text-right">Cost</th>
                <th className="px-4 py-2.5 text-right">Sell</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const low = r.quantity <= r.reorderLevel
                const expSoon = r.expiryDate && r.expiryDate.getTime() < Date.now() + 30 * 864e5
                return (
                  <tr key={r.id} className={r.isActive ? 'hover:bg-muted/30' : 'opacity-50'}>
                    <td className="px-4 py-2.5">
                      <Link href={`/pharmacy/inventory/${r.id}`} className="font-medium hover:underline">
                        {r.medicine.name}{r.medicine.strength ? ` ${r.medicine.strength}` : ''}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {r.batchNumber ?? '—'}
                      {r.expiryDate ? <span className={expSoon ? 'ml-1 text-xs text-amber-700' : 'ml-1 text-xs'}>exp {r.expiryDate.toLocaleDateString()}</span> : null}
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums ${low ? 'text-red-600 font-medium' : ''}`}>{r.quantity}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(r.costPrice)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(r.sellingPrice)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination basePath="/pharmacy/inventory" page={page} totalPages={Math.max(1, Math.ceil(total / limit))} query={{ q: search }} />
    </div>
  )
}
