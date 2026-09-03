import { Card, StatusBadge } from '@/components/dashboard/ui'
import { DocumentActions } from '@/components/admin/verification-actions'

interface DocRow {
  id: number
  documentType: string
  fileName: string
  fileUrl: string
  verificationStatus: string
  rejectionReason: string | null
  createdAt: Date
}

export function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  )
}

export function DocumentsCard({ documents }: { documents: DocRow[] }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">Documents ({documents.length})</h2>
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {doc.documentType.replace(/_/g, ' ').toLowerCase()}
                </a>
                <div className="text-xs text-muted-foreground">{doc.fileName}</div>
                {doc.rejectionReason ? (
                  <div className="text-xs text-red-600">Rejected: {doc.rejectionReason}</div>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={doc.verificationStatus} />
                {doc.verificationStatus === 'PENDING' ? <DocumentActions id={doc.id} /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
