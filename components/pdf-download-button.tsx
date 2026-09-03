'use client'

import { useState } from 'react'

/**
 * Renders the element with id={targetId} to a downloadable PDF, client-side.
 * html2pdf.js is loaded lazily so it never touches the server bundle.
 */
export function PdfDownloadButton({ targetId, fileName }: { targetId: string; fileName: string }) {
  const [busy, setBusy] = useState(false)

  async function download() {
    const el = document.getElementById(targetId)
    if (!el) return
    setBusy(true)
    try {
      const mod = await import('html2pdf.js')
      const html2pdf = (mod.default ?? mod) as (...args: unknown[]) => { set: (o: unknown) => { from: (e: Element) => { save: () => Promise<void> } } }
      await html2pdf()
        .set({
          margin: 10,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(el)
        .save()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
    >
      {busy ? 'Preparing…' : 'Download PDF'}
    </button>
  )
}
