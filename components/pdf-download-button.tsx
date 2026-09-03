'use client'

import { Download } from 'lucide-react'

/**
 * "Download PDF" via the browser's print engine (Save as PDF). Reliable across
 * design systems — unlike canvas rasterisers it handles modern CSS colour
 * functions (oklch/lab) that the app's tokens use.
 */
export function PdfDownloadButton({ targetId, fileName }: { targetId: string; fileName: string }) {
  function download() {
    const el = document.getElementById(targetId)
    if (!el) {
      window.print()
      return
    }
    const w = window.open('', '_blank', 'width=900,height=1200')
    if (!w) {
      window.print()
      return
    }
    w.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${fileName.replace(/\.pdf$/, '').replace(/[<>]/g, '')}</title>` +
        `<style>@page{size:A4;margin:12mm}html,body{margin:0;background:#fff;font-family:system-ui,sans-serif;` +
        `-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${el.outerHTML}</body></html>`,
    )
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
    >
      <Download className="h-4 w-4" /> Download PDF
    </button>
  )
}
