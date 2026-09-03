'use client'

import { Printer, Download } from 'lucide-react'

/**
 * Print and Download-PDF for the tax invoice. Both go through the browser's own
 * print engine (Chrome/Edge/Safari "Save as PDF"), which renders a pixel-perfect
 * A4 document — far more reliable than a canvas rasteriser, and the invoice's
 * inline styles carry over verbatim.
 */
export function InvoiceActions({ targetId, fileName }: { targetId: string; fileName: string }) {
  function openPrintWindow() {
    const el = document.getElementById(targetId)
    if (!el) return
    const w = window.open('', '_blank', 'width=900,height=1200')
    if (!w) {
      window.print()
      return
    }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${fileName.replace(/\.pdf$/, '')}</title>
<style>
  @page { size: A4; margin: 0; }
  html,body { margin: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  #tax-invoice { box-shadow: none !important; }
</style></head><body>${el.outerHTML}</body></html>`)
    w.document.close()
    w.focus()
    // Give the layout a tick, then open the print dialog.
    setTimeout(() => {
      w.print()
    }, 300)
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
      >
        <Printer className="h-4 w-4" /> Print
      </button>
      <button
        type="button"
        onClick={openPrintWindow}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Download className="h-4 w-4" /> Download PDF
      </button>
    </div>
  )
}
