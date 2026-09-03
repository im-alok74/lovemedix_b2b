'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

import { useToast } from '@/hooks/use-toast'

const COLUMNS = ['medicineId', 'batchNumber', 'mfgDate', 'expiryDate', 'mrp', 'unitPrice', 'quantity', 'minOrderQuantity', 'hsnCode']

interface ParsedRow {
  medicineId: number
  batchNumber?: string
  mfgDate?: string
  expiryDate: string
  mrp: number
  unitPrice: number
  quantity: number
  minOrderQuantity?: number
  hsnCode?: string
}

export function BulkUpload() {
  const router = useRouter()
  const { toast } = useToast()
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ created: number; updated: number; skipped: { row: number; reason: string }[] } | null>(null)

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([COLUMNS, [101, 'B1234', '2026-01-01', '2027-12-31', 120.5, 98.0, 500, 10, '3004']])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'listings')
    XLSX.writeFile(wb, 'lovemedix-listings-template.xlsx')
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf)
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
    const errs: string[] = []
    const parsed: ParsedRow[] = []
    json.forEach((r, i) => {
      const medicineId = Number(r.medicineId)
      const expiryDate = String(r.expiryDate ?? '').slice(0, 10)
      if (!medicineId || !expiryDate || r.mrp == null || r.unitPrice == null || r.quantity == null) {
        errs.push(`Row ${i + 2}: missing required column`)
        return
      }
      parsed.push({
        medicineId,
        batchNumber: r.batchNumber ? String(r.batchNumber) : undefined,
        mfgDate: r.mfgDate ? String(r.mfgDate).slice(0, 10) : undefined,
        expiryDate,
        mrp: Number(r.mrp),
        unitPrice: Number(r.unitPrice),
        quantity: Number(r.quantity),
        minOrderQuantity: r.minOrderQuantity ? Number(r.minOrderQuantity) : undefined,
        hsnCode: r.hsnCode ? String(r.hsnCode) : undefined,
      })
    })
    setErrors(errs)
    setRows(parsed)
  }

  async function upload() {
    if (rows.length === 0) return
    setBusy(true)
    try {
      const res = await fetch('/api/distributor/listings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        toast({ title: 'Upload failed', description: data?.error, variant: 'destructive' })
        return
      }
      setResult(data.data)
      setRows([])
      toast({ title: `Imported ${data.data.created + data.data.updated} listings` })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 text-sm">
        <p className="font-medium">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Download the template and fill one row per batch.</li>
          <li><code>medicineId</code> comes from the catalog — ask your admin for the export, or use the catalog IDs.</li>
          <li>Upload the file, review the preview, then import. Existing (medicine + batch) rows are updated.</li>
        </ol>
        <button onClick={downloadTemplate} className="mt-3 rounded-md border border-border px-3 py-1.5 font-medium hover:bg-muted">
          Download template
        </button>
      </div>

      <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="block text-sm" />

      {errors.length > 0 ? (
        <ul className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {errors.slice(0, 10).map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}

      {rows.length > 0 ? (
        <div className="rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border p-3 text-sm">
            <span>{rows.length} rows ready</span>
            <button
              onClick={upload}
              disabled={busy}
              className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? 'Importing…' : 'Import'}
            </button>
          </div>
          <div className="max-h-72 overflow-auto p-3 text-xs">
            <pre>{JSON.stringify(rows.slice(0, 20), null, 2)}</pre>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Created {result.created}, updated {result.updated}, skipped {result.skipped.length}.
          {result.skipped.length > 0 ? (
            <ul className="mt-1 list-disc pl-5">
              {result.skipped.slice(0, 10).map((s) => (
                <li key={s.row}>Row {s.row}: {s.reason}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
