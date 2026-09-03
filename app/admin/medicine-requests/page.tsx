import prisma from '@/lib/prisma'
import { PageHeading, Card, EmptyState, StatusBadge } from '@/components/dashboard/ui'

export const metadata = { title: 'Medicine requests' }
export const dynamic = 'force-dynamic'

export default async function AdminMedicineRequestsPage() {
  const requests = await prisma.medicineRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      pharmacy: { select: { pharmacyName: true } },
      distributor: { select: { companyName: true } },
      medicine: { select: { name: true, strength: true } },
    },
  })

  return (
    <div>
      <PageHeading title="Medicine requests" description="New-medicine and out-of-stock requests raised by pharmacies." />
      {requests.length === 0 ? (
        <EmptyState title="No requests yet" />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Pharmacy</th>
                <th className="px-4 py-2.5">Medicine</th>
                <th className="px-4 py-2.5">Kind</th>
                <th className="px-4 py-2.5">Qty</th>
                <th className="px-4 py-2.5">Routed to</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Raised</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{r.pharmacy.pharmacyName}</td>
                  <td className="px-4 py-2.5">
                    {r.medicine ? `${r.medicine.name}${r.medicine.strength ? ` ${r.medicine.strength}` : ''}` : r.requestedName}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.kind.replace(/_/g, ' ').toLowerCase()}</td>
                  <td className="px-4 py-2.5 tabular-nums">{r.requestedQuantity}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.distributor?.companyName ?? '—'}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
