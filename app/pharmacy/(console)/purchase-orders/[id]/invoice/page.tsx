import Link from 'next/link'
import { notFound } from 'next/navigation'

import prisma from '@/lib/prisma'
import { getPharmacyContext } from '@/lib/auth'
import { InvoiceView } from '@/components/orders/invoice-view'
import { PdfDownloadButton } from '@/components/pdf-download-button'

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href={`/pharmacy/purchase-orders/${orderId}`} className="text-sm text-muted-foreground hover:underline">← Back to order</Link>
        <PdfDownloadButton targetId="invoice-doc" fileName={`${invoice.invoiceNumber}.pdf`} />
      </div>
      <div className="mt-4">
        <InvoiceView invoice={invoice} />
      </div>
    </div>
  )
}
