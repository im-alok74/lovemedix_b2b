'use client'

import { ApiAction } from '@/components/dashboard/api-action'

export function VerificationActions({
  kind,
  id,
  status,
}: {
  kind: 'pharmacies' | 'distributors'
  id: number
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
}) {
  const endpoint = `/api/admin/${kind}/${id}`
  return (
    <div className="flex flex-wrap gap-2">
      {status !== 'VERIFIED' ? (
        <ApiAction endpoint={endpoint} body={{ action: 'approve' }} label="Approve" variant="primary" />
      ) : null}
      {status !== 'REJECTED' ? (
        <ApiAction
          endpoint={endpoint}
          body={{ action: 'reject' }}
          promptReason="reason"
          label="Reject"
          variant="danger"
          confirm="Reject this registration?"
        />
      ) : null}
      <ApiAction
        endpoint={endpoint}
        body={{ action: 'suspend' }}
        promptReason="reason"
        label="Suspend"
        variant="secondary"
        confirm="Suspend this account and end its sessions?"
      />
    </div>
  )
}

export function DocumentActions({ id }: { id: number }) {
  const endpoint = `/api/admin/documents/${id}`
  return (
    <div className="flex gap-2">
      <ApiAction endpoint={endpoint} body={{ action: 'verify' }} label="Verify" variant="primary" />
      <ApiAction endpoint={endpoint} body={{ action: 'reject' }} promptReason="reason" label="Reject" variant="danger" />
    </div>
  )
}
