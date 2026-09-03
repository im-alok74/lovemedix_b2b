import Link from 'next/link'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { PageHeading, Card, EmptyState, StatusBadge } from '@/components/dashboard/ui'
import { ApiAction } from '@/components/dashboard/api-action'

export const metadata = { title: 'Medicine requests' }
export const dynamic = 'force-dynamic'

export default async function PharmacyRequestsPage() {
  const ctx = await getPharmacyContext()
  if (!ctx?.id) return null

  const requests = await prisma.medicineRequest.findMany({
    where: { pharmacyId: ctx.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      medicine: { select: { name: true, strength: true } },
      distributor: { select: { companyName: true } },
    },
  })

  return (
    <div>
      <PageHeading
        title="Medicine requests"
        description="Ask distributors for new or out-of-stock medicines."
        action={<Link href="/pharmacy/requests/new" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">New request</Link>}
      />
      {requests.length === 0 ? (
        <EmptyState title="No requests" />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">
                  {r.medicine ? `${r.medicine.name}${r.medicine.strength ? ` ${r.medicine.strength}` : ''}` : r.requestedName}
                </p>
                <p className="text-sm text-muted-foreground">
                  qty {r.requestedQuantity} · {r.kind.replace(/_/g, ' ').toLowerCase()} · {r.distributor?.companyName ?? 'any distributor'}
                </p>
                {r.resolutionNote ? <p className="mt-1 text-sm text-muted-foreground">Distributor: {r.resolutionNote}</p> : null}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={r.status} />
                {['OPEN', 'IN_PROGRESS'].includes(r.status) ? (
                  <ApiAction endpoint={`/api/pharmacy/requests/${r.id}`} method="PATCH" label="Cancel" variant="secondary" confirm="Cancel this request?" />
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
