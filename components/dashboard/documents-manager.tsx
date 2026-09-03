'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { StatusBadge } from '@/components/dashboard/ui'

interface DocRow {
  id: number
  documentType: string
  fileName: string
  fileUrl: string
  verificationStatus: string
  rejectionReason: string | null
  createdAt: string
}

const TYPES = [
  ['DRUG_LICENSE', 'Drug licence'],
  ['GST_CERTIFICATE', 'GST certificate'],
  ['BUSINESS_REGISTRATION', 'Business registration'],
  ['ADDRESS_PROOF', 'Address proof'],
  ['IDENTITY_PROOF', 'Identity proof'],
  ['OTHER', 'Other'],
] as const

export function DocumentsManager({ endpoint, documents }: { endpoint: string; documents: DocRow[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({ documentType: 'DRUG_LICENSE', fileName: '', fileUrl: '', expiresAt: '', fileSize: 0, mimeType: '' })
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/uploads', { method: 'POST', body })
      const data = await res.json().catch(() => ({}))
      if (res.status === 501) {
        toast({ title: 'Paste a link instead', description: data?.error })
        return
      }
      if (!res.ok || data?.success === false) {
        toast({ title: 'Upload failed', description: data?.error, variant: 'destructive' })
        return
      }
      setForm((f) => ({
        ...f,
        fileUrl: data.data.fileUrl,
        fileName: f.fileName || data.data.fileName,
        fileSize: data.data.fileSize ?? 0,
        mimeType: data.data.mimeType ?? '',
      }))
      toast({ title: 'File uploaded', description: 'Set the type and save.' })
    } finally {
      setUploading(false)
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fileSize: form.fileSize || null, mimeType: form.mimeType || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Upload failed', description: data?.error, variant: 'destructive' })
        return
      }
      setForm({ documentType: 'DRUG_LICENSE', fileName: '', fileUrl: '', expiresAt: '', fileSize: 0, mimeType: '' })
      toast({ title: 'Document added', description: 'It will be reviewed by our team.' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number) {
    if (!window.confirm('Remove this document?')) return
    const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data?.success === false) {
      toast({ title: 'Could not remove', description: data?.error, variant: 'destructive' })
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Uploaded documents</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents yet. Add your drug licence and GST certificate to get approved.</p>
        ) : (
          <ul className="divide-y divide-border">
            {documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
                    {d.documentType.replace(/_/g, ' ').toLowerCase()}
                  </a>
                  <div className="text-xs text-muted-foreground">{d.fileName}</div>
                  {d.rejectionReason ? <div className="text-xs text-red-600">Rejected: {d.rejectionReason}</div> : null}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={d.verificationStatus} />
                  {d.verificationStatus !== 'VERIFIED' ? (
                    <button onClick={() => remove(d.id)} className="text-xs text-red-600 hover:underline">
                      Remove
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={add} className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Add a document</h2>
        <div className="mb-4 space-y-1">
          <Label>Upload a file</Label>
          <input type="file" accept=".pdf,image/*" onChange={onFile} disabled={uploading} className="block text-sm" />
          <p className="text-xs text-muted-foreground">
            {uploading ? 'Uploading…' : 'PDF or image, up to 8 MB. Or paste a shareable link below.'}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Document type</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.documentType}
              onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))}
            >
              {TYPES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>File name</Label>
            <Input value={form.fileName} onChange={(e) => setForm((f) => ({ ...f, fileName: e.target.value }))} required />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>File URL</Label>
            <Input
              type="url"
              value={form.fileUrl}
              onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
              placeholder="https://…"
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Expiry date (optional)</Label>
            <Input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? 'Adding…' : 'Add document'}
        </button>
      </form>
    </div>
  )
}
