'use client'

import { ApiAction } from '@/components/dashboard/api-action'

const DISTRIBUTOR_NEXT: Record<string, { to: string; label: string; variant: 'primary' | 'secondary' | 'danger' }[]> = {
  PENDING: [
    { to: 'CONFIRMED', label: 'Accept order', variant: 'primary' },
    { to: 'REJECTED', label: 'Reject', variant: 'danger' },
  ],
  CONFIRMED: [{ to: 'PROCESSING', label: 'Start processing', variant: 'primary' }],
  PROCESSING: [{ to: 'SHIPPED', label: 'Mark shipped', variant: 'primary' }],
  SHIPPED: [{ to: 'DELIVERED', label: 'Mark delivered', variant: 'primary' }],
}

export function OrderActions({
  orderId,
  status,
  role,
}: {
  orderId: number
  status: string
  role: 'PHARMACY' | 'DISTRIBUTOR'
}) {
  const endpoint =
    role === 'DISTRIBUTOR'
      ? `/api/distributor/purchase-orders/${orderId}`
      : `/api/pharmacy/purchase-orders/${orderId}`

  if (role === 'PHARMACY') {
    if (status !== 'PENDING' && status !== 'CONFIRMED') return null
    return (
      <ApiAction
        endpoint={endpoint}
        body={{ status: 'CANCELLED' }}
        promptReason="note"
        label="Cancel order"
        variant="danger"
        confirm="Cancel this order?"
      />
    )
  }

  const next = DISTRIBUTOR_NEXT[status] ?? []
  if (next.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {next.map((n) => (
        <ApiAction
          key={n.to}
          endpoint={endpoint}
          body={{ status: n.to }}
          promptReason={n.to === 'REJECTED' ? 'note' : undefined}
          label={n.label}
          variant={n.variant}
          confirm={n.to === 'REJECTED' ? 'Reject this order?' : undefined}
        />
      ))}
    </div>
  )
}
