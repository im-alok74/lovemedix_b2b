/**
 * Client-side PDF export for invoices.
 *
 * One implementation for the whole app. Previously two invoice components each rolled
 * their own: one drove `html2pdf.js`, the other wired `html2canvas` + `jspdf` by hand
 * (and did so incorrectly — `new jsPDF.jsPDF()` is not a constructor, so that button
 * threw on every click). Three overlapping PDF dependencies for one feature.
 *
 * `html2pdf.js` already bundles html2canvas and jsPDF, so they are no longer direct
 * dependencies.
 *
 * Known limitation, worth fixing eventually: this rasterises the invoice to an image, so
 * the resulting PDF has no selectable text, is not searchable, is unusable with a screen
 * reader, and is large. For a GST tax invoice that customers may need to forward to an
 * accountant or insurer, server-side generation producing real text would be materially
 * better. Tracked in AGENT_HANDOFF.md.
 */

export interface InvoicePdfOptions {
  /** Element to render. Usually a ref's `.current`. */
  element: HTMLElement
  /** Order number, used to name the file. */
  orderNumber: string
  /** Filename prefix. Defaults to "Invoice". */
  prefix?: string
}

export async function downloadInvoicePdf({
  element,
  orderNumber,
  prefix = "Invoice",
}: InvoicePdfOptions): Promise<void> {
  // Dynamic import: html2pdf pulls in html2canvas and jsPDF, which together are a large
  // bundle and touch `window` at module scope. Keeping it out of the initial page load
  // matters on a page most users never export from.
  const { default: html2pdf } = await import("html2pdf.js")

  await html2pdf()
    .set({
      margin: 10,
      filename: `${prefix}-${orderNumber}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        // Without this, a long invoice scrolled halfway down renders blank below the fold.
        scrollY: 0,
      },
      jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" },
      // `pagebreak` is a real html2pdf option but is missing from the bundled types, so
      // it has to be merged in outside the typed literal. Without it a table row can be
      // sliced in half across a page boundary.
      ...({ pagebreak: { mode: ["avoid-all", "css", "legacy"] } } as object),
    })
    .from(element)
    .save()
}
