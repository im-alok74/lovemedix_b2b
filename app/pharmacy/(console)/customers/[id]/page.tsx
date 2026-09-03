import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { PageHeading, Card, StatusBadge } from '@/components/dashboard/ui'
import { CustomerForm } from '@/components/pharmacy/customer-form'
import { ApiAction } from '@/components/dashboard/api-action'
import { formatINR } from '@/lib/money'

export const dynamic = 'force-dynamic'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getPharmacyContext()
  if (!ctx?.id) return null
  const id = Number((await params).id)
  const customer = await prisma.customer.findFirst({
    where: { id, pharmacyId: ctx.id },
    include: { sales: { orderBy: { billDate: 'desc' }, take: 20 } },
  })
  if (!customer) notFound()

  return (
    <div className="max-w-3xl">
      <Link href="/pharmacy/customers" className="text-sm text-muted-foreground hover:underline">← Customers</Link>
      <PageHeading
        title={customer.name}
        action={
          <ApiAction endpoint={`/api/pharmacy/customers/${id}`} method="DELETE" label="Delete" variant="danger" confirm="Delete this customer?" redirectTo="/pharmacy/customers" />
        }
      />
      <Card className="mb-6 p-5">
        <CustomerForm
          initial={{
            id: customer.id,
            name: customer.name,
            phone: customer.phone ?? '',
            email: customer.email ?? '',
            address: customer.address ?? '',
            notes: customer.notes ?? '',
          }}
        />
      </Card>

      <h2 className="mb-2 text-sm font-semibold">Recent bills</h2>
      {customer.sales.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bills yet.</p>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {customer.sales.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <Link href={`/pharmacy/sales/${s.id}`} className="font-medium hover:underline">{s.billNumber}</Link>
                    <span className="ml-2 text-xs text-muted-foreground">{s.billDate.toLocaleDateString()}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(s.totalAmount)}</td>
                  <td className="px-4 py-2.5 text-right"><StatusBadge status={s.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
