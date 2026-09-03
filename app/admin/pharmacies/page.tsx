import Link from 'next/link'
import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import { PageHeading, Card, EmptyState, StatusBadge, Pagination } from '@/components/dashboard/ui'
import { parseListParams } from '@/lib/list-params'

export const metadata = { title: 'Pharmacies' }

const STATUS_TABS = ['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const

export default async function AdminPharmaciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { page, limit, skip, search, status } = parseListParams(sp, { limit: 20 })

  const where: Prisma.PharmacyProfileWhereInput = {
    ...(status && status !== 'ALL' ? { verificationStatus: status as Prisma.EnumVerificationStatusFilter['equals'] } : {}),
    ...(search
      ? {
          OR: [
            { pharmacyName: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  }

  const [rows, total] = await Promise.all([
    prisma.pharmacyProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        pharmacyName: true,
        city: true,
        state: true,
        gstNumber: true,
        verificationStatus: true,
        createdAt: true,
        user: { select: { email: true, phone: true } },
        _count: { select: { documents: true } },
      },
    }),
    prisma.pharmacyProfile.count({ where }),
  ])

  return (
    <div>
      <PageHeading title="Pharmacies" description={`${total} registered`} />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/pharmacies?status=${t}`}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              (status || 'ALL') === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
            }`}
          >
            {t.toLowerCase()}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No pharmacies match" />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Pharmacy</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Docs</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/pharmacies/${r.id}`} className="font-medium hover:underline">
                      {r.pharmacyName}
                    </Link>
                    {r.gstNumber ? <div className="text-xs text-muted-foreground">GST {r.gstNumber}</div> : null}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.city}, {r.state}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <div>{r.user.email}</div>
                    {r.user.phone ? <div className="text-xs">{r.user.phone}</div> : null}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{r._count.documents}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={r.verificationStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Pagination
        basePath="/admin/pharmacies"
        page={page}
        totalPages={Math.max(1, Math.ceil(total / limit))}
        query={{ status, q: search }}
      />
    </div>
  )
}
