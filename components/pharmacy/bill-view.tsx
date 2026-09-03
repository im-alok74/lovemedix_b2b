import type { Prisma } from '@prisma/client'

import { formatINR } from '@/lib/money'
import { SITE } from '@/lib/site'
import { StatusBadge } from '@/components/dashboard/ui'

type SalePayload = Prisma.SaleGetPayload<{
  include: { items: true; customer: true; pharmacy: true }
}>

export function BillView({ sale }: { sale: SalePayload }) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-border bg-white p-8 text-sm text-zinc-900 print:border-0 print:p-0">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold">{sale.pharmacy.pharmacyName}</p>
          <p className="text-zinc-500">
            {sale.pharmacy.addressLine1}, {sale.pharmacy.city}, {sale.pharmacy.state} {sale.pharmacy.pincode}
          </p>
          {sale.pharmacy.gstNumber ? <p className="text-zinc-500">GSTIN: {sale.pharmacy.gstNumber}</p> : null}
          {sale.pharmacy.drugLicenseNumber ? <p className="text-zinc-500">DL: {sale.pharmacy.drugLicenseNumber}</p> : null}
        </div>
        <div className="text-right">
          <p className="font-semibold">{sale.billNumber}</p>
          <p className="text-zinc-500">{sale.billDate.toLocaleString()}</p>
          <StatusBadge status={sale.paymentStatus} />
        </div>
      </div>

      <p className="mt-4 text-zinc-600">
        Billed to: <span className="font-medium">{sale.customer?.name ?? 'Walk-in customer'}</span>
        {sale.customer?.phone ? ` · ${sale.customer.phone}` : ''}
      </p>
      {sale.prescriptionRef ? <p className="text-zinc-500">Prescription ref: {sale.prescriptionRef}</p> : null}

      <table className="mt-4 w-full border-collapse text-xs">
        <thead>
          <tr className="border-y border-zinc-300 text-left">
            <th className="py-2">#</th>
            <th className="py-2">Item</th>
            <th className="py-2">Batch</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Rate</th>
            <th className="py-2 text-right">Disc%</th>
            <th className="py-2 text-right">GST%</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((it, i) => (
            <tr key={it.id} className="border-b border-zinc-200">
              <td className="py-2">{i + 1}</td>
              <td className="py-2">{it.description}</td>
              <td className="py-2">{it.batchNumber ?? '—'}</td>
              <td className="py-2 text-right">{it.quantity}</td>
              <td className="py-2 text-right">{formatINR(it.unitPrice)}</td>
              <td className="py-2 text-right">{Number(it.discountPercent)}</td>
              <td className="py-2 text-right">{Number(it.gstRate)}</td>
              <td className="py-2 text-right">{formatINR(it.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <dl className="w-56 space-y-1">
          <div className="flex justify-between"><dt className="text-zinc-500">Subtotal</dt><dd>{formatINR(sale.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">Discount</dt><dd>−{formatINR(sale.discountAmount)}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">GST</dt><dd>{formatINR(sale.taxAmount)}</dd></div>
          <div className="flex justify-between border-t border-zinc-300 pt-1 font-semibold"><dt>Total</dt><dd>{formatINR(sale.totalAmount)}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">Paid</dt><dd>{formatINR(sale.amountPaid)}</dd></div>
        </dl>
      </div>

      <p className="mt-8 text-xs text-zinc-400">Powered by {SITE.name}. Medicines once sold are not returnable except as per policy.</p>
    </div>
  )
}
