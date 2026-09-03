import prisma from '@/lib/prisma'
import { getDistributorContext } from '@/lib/auth'
import { PageHeading, Card, EmptyState, StatusBadge } from '@/components/dashboard/ui'
import { ApiAction } from '@/components/dashboard/api-action'

export const metadata = { title: 'Medicine requests' }
export const dynamic = 'force-dynamic'

export default async function DistributorRequestsPage() {
  const ctx = await getDistributorContext()
  if (!ctx?.id) return null

  const requests = await prisma.medicineRequest.findMany({
    where: { distributorId: ctx.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      pharmacy: { select: { pharmacyName: true, city: true } },
      medicine: { select: { name: true, strength: true } },
    },
  })

  return (
    <div>
      <PageHeading title="Medicine requests" description="Requests pharmacies routed to you for new or out-of-stock medicines." />
      {requests.length === 0 ? (
        <EmptyState title="No requests" />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {r.medicine ? `${r.medicine.name}${r.medicine.strength ? ` ${r.medicine.strength}` : ''}` : r.requestedName}
                    {r.manufacturer ? <span className="text-muted-foreground"> · {r.manufacturer}</span> : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {r.pharmacy.pharmacyName}, {r.pharmacy.city} · qty {r.requestedQuantity} · {r.kind.replace(/_/g, ' ').toLowerCase()}
                  </p>
                  {r.notes ? <p className="mt-1 text-sm">{r.notes}</p> : null}
                  {r.resolutionNote ? <p className="mt-1 text-sm text-muted-foreground">You: {r.resolutionNote}</p> : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={r.status} />
                  {['OPEN', 'IN_PROGRESS'].includes(r.status) ? (
                    <div className="flex gap-2">
                      {r.status === 'OPEN' ? (
                        <ApiAction endpoint={`/api/distributor/requests/${r.id}`} body={{ status: 'IN_PROGRESS' }} label="Working on it" variant="secondary" />
                      ) : null}
                      <ApiAction
                        endpoint={`/api/distributor/requests/${r.id}`}
                        body={{ status: 'FULFILLED' }}
                        promptReason="resolutionNote"
                        label="Mark fulfilled"
                        variant="primary"
                      />
                      <ApiAction
                        endpoint={`/api/distributor/requests/${r.id}`}
                        body={{ status: 'CANCELLED' }}
                        promptReason="resolutionNote"
                        label="Decline"
                        variant="danger"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
