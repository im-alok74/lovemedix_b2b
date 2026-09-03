import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { computeInvoice } from '@/lib/invoice'
import { TaxInvoice } from '@/components/orders/tax-invoice'
import { InvoiceActions } from '@/components/orders/invoice-actions'

export const dynamic = 'force-dynamic'

export default async function PharmacyInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getPharmacyContext()
  if (!ctx?.id) return null
  const orderId = Number((await params).id)
  const invoice = await prisma.invoice.findFirst({
    where: { orderId, order: { pharmacyId: ctx.id } },
    include: { order: { include: { items: { include: { medicine: true } }, pharmacy: true, distributor: true } } },
  })
  if (!invoice) notFound()

  const data = computeInvoice(invoice)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/pharmacy/purchase-orders/${orderId}`} className="text-sm text-muted-foreground hover:underline">
          ← Back to order
        </Link>
        <InvoiceActions targetId="tax-invoice" fileName={`${invoice.invoiceNumber}.pdf`} />
      </div>
      <div className="overflow-x-auto">
        <TaxInvoice data={data} />
      </div>
    </div>
  )
}
