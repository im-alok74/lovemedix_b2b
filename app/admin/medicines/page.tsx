import Link from 'next/link'
import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import { PageHeading, Card, EmptyState, StatusBadge, Pagination } from '@/components/dashboard/ui'
import { parseListParams } from '@/lib/list-params'
import { formatINR } from '@/lib/money'

export const metadata = { title: 'Medicine catalog' }
export const dynamic = 'force-dynamic'

export default async function AdminMedicinesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { page, limit, skip, search, status } = parseListParams(sp, { limit: 25 })
  const where: Prisma.MedicineWhereInput = {
    ...(status && status !== 'ALL' ? { status: status as Prisma.EnumMedicineStatusFilter['equals'] } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { genericName: { contains: search, mode: 'insensitive' } },
            { manufacturer: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [rows, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      select: {
        id: true, name: true, strength: true, manufacturer: true, mrp: true, gstRate: true,
        status: true, requiresPrescription: true,
        category: { select: { name: true } },
        _count: { select: { listings: true } },
      },
    }),
    prisma.medicine.count({ where }),
  ])

  return (
    <div>
      <PageHeading
        title="Medicine catalog"
        description={`${total} medicines`}
        action={
          <Link
            href="/admin/medicines/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New medicine
          </Link>
        }
      />
      <form className="mb-4" action="/admin/medicines">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search name, generic, manufacturer…"
          className="h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
        />
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No medicines" message="Add medicines so distributors can list stock against them." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Manufacturer</th>
                <th className="px-4 py-2.5 text-right">MRP</th>
                <th className="px-4 py-2.5 text-right">GST%</th>
                <th className="px-4 py-2.5 text-right">Listings</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/medicines/${m.id}`} className="font-medium hover:underline">
                      {m.name}{m.strength ? ` ${m.strength}` : ''}
                    </Link>
                    {m.requiresPrescription ? <span className="ml-2 text-xs text-amber-700">Rx</span> : null}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{m.category?.name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{m.manufacturer ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(m.mrp)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{Number(m.gstRate)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{m._count.listings}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination basePath="/admin/medicines" page={page} totalPages={Math.max(1, Math.ceil(total / limit))} query={{ q: search, status }} />
    </div>
  )
}
