import { Card, StatusBadge } from '@/components/dashboard/ui'
import { formatINR } from '@/lib/money'
import type { Prisma } from '@prisma/client'

type OrderWithRelations = Prisma.PurchaseOrderGetPayload<{
  include: {
    items: { include: { medicine: true } }
    events: true
    pharmacy: true
    distributor: true
    invoice: true
  }
}>

export function OrderView({ order }: { order: OrderWithRelations }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Order</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs uppercase text-muted-foreground">Number</dt><dd>{order.orderNumber}</dd></div>
            <div><dt className="text-xs uppercase text-muted-foreground">Placed</dt><dd>{order.createdAt.toLocaleString()}</dd></div>
            <div><dt className="text-xs uppercase text-muted-foreground">Status</dt><dd><StatusBadge status={order.status} /></dd></div>
            <div><dt className="text-xs uppercase text-muted-foreground">Payment</dt><dd><StatusBadge status={order.paymentStatus} /></dd></div>
            {order.expectedBy ? (
              <div><dt className="text-xs uppercase text-muted-foreground">Expected by</dt><dd>{order.expectedBy.toLocaleDateString()}</dd></div>
            ) : null}
          </dl>
          {order.pharmacyNote ? <p className="mt-3 text-sm"><span className="text-muted-foreground">Pharmacy note:</span> {order.pharmacyNote}</p> : null}
          {order.distributorNote ? <p className="mt-1 text-sm"><span className="text-muted-foreground">Distributor note:</span> {order.distributorNote}</p> : null}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Parties</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Pharmacy (buyer)</p>
              <p className="font-medium">{order.pharmacy.pharmacyName}</p>
              <p className="text-muted-foreground">{order.pharmacy.city}, {order.pharmacy.state} · {order.pharmacy.phone}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Distributor (seller)</p>
              <p className="font-medium">{order.distributor.companyName}</p>
              <p className="text-muted-foreground">{order.distributor.city}, {order.distributor.state} · {order.distributor.phone}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Medicine</th>
              <th className="px-4 py-2.5">Batch / expiry</th>
              <th className="px-4 py-2.5 text-right">Qty</th>
              <th className="px-4 py-2.5 text-right">Unit</th>
              <th className="px-4 py-2.5 text-right">Disc%</th>
              <th className="px-4 py-2.5 text-right">GST%</th>
              <th className="px-4 py-2.5 text-right">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.items.map((it) => (
              <tr key={it.id}>
                <td className="px-4 py-2.5">
                  {it.medicine.name}
                  {it.medicine.strength ? <span className="text-muted-foreground"> {it.medicine.strength}</span> : null}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {it.batchNumber ?? '—'}{it.expiryDate ? ` · ${it.expiryDate.toLocaleDateString()}` : ''}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{it.quantity}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(it.unitPrice)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{Number(it.discountPercent)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{Number(it.gstRate)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-border">
            <tr><td colSpan={6} className="px-4 py-1.5 text-right text-muted-foreground">Subtotal</td><td className="px-4 py-1.5 text-right tabular-nums">{formatINR(order.subtotal)}</td></tr>
            <tr><td colSpan={6} className="px-4 py-1.5 text-right text-muted-foreground">Discount</td><td className="px-4 py-1.5 text-right tabular-nums">−{formatINR(order.discountAmount)}</td></tr>
            <tr><td colSpan={6} className="px-4 py-1.5 text-right text-muted-foreground">GST</td><td className="px-4 py-1.5 text-right tabular-nums">{formatINR(order.taxAmount)}</td></tr>
            <tr className="font-semibold"><td colSpan={6} className="px-4 py-2 text-right">Total</td><td className="px-4 py-2 text-right tabular-nums">{formatINR(order.totalAmount)}</td></tr>
          </tfoot>
        </table>
      </Card>

      {order.events.length > 0 ? (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">History</h2>
          <ol className="space-y-2 text-sm">
            {order.events.map((e) => (
              <li key={e.id} className="flex gap-3">
                <span className="text-muted-foreground">{e.createdAt.toLocaleString()}</span>
                <span className="font-medium">{e.status.replace(/_/g, ' ').toLowerCase()}</span>
                {e.note ? <span className="text-muted-foreground">— {e.note}</span> : null}
              </li>
            ))}
          </ol>
        </Card>
      ) : null}
    </div>
  )
}
