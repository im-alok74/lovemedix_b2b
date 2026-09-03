import type { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import { PageHeading, Card, EmptyState, StatusBadge, Pagination } from '@/components/dashboard/ui'
import { parseListParams } from '@/lib/list-params'
import { ApiAction } from '@/components/dashboard/api-action'

export const metadata = { title: 'Users' }
export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { page, limit, skip, search } = parseListParams(sp, { limit: 25 })
  const where: Prisma.UserWhereInput = {
    role: { in: ['PHARMACY', 'DISTRIBUTOR'] },
    ...(search
      ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { fullName: { contains: search, mode: 'insensitive' } }] }
      : {}),
  }

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: { id: true, email: true, fullName: true, phone: true, role: true, status: true, lastLoginAt: true },
    }),
    prisma.user.count({ where }),
  ])

  return (
    <div>
      <PageHeading title="Users" description={`${total} pharmacy & distributor accounts`} />
      {rows.length === 0 ? (
        <EmptyState title="No users" />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Last login</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{u.fullName}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u.role.toLowerCase()}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {u.lastLoginAt ? u.lastLoginAt.toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-2.5">
                    {u.status === 'ACTIVE' ? (
                      <ApiAction
                        endpoint={`/api/admin/users/${u.id}`}
                        body={{ status: 'SUSPENDED' }}
                        label="Suspend"
                        variant="danger"
                        confirm={`Suspend ${u.email}?`}
                      />
                    ) : (
                      <ApiAction
                        endpoint={`/api/admin/users/${u.id}`}
                        body={{ status: 'ACTIVE' }}
                        label="Reactivate"
                        variant="secondary"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination basePath="/admin/users" page={page} totalPages={Math.max(1, Math.ceil(total / limit))} query={{ q: search }} />
    </div>
  )
}
