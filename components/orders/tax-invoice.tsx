import { SITE } from '@/lib/site'
import { formatINR } from '@/lib/money'
import type { ComputedInvoice } from '@/lib/invoice'

/*
 * Self-contained palette in hex/rgb. The invoice must render identically in the
 * browser and inside html2canvas (which cannot parse oklch/lab), so it does NOT
 * use Tailwind color utilities or CSS custom properties for colour.
 */
const NAVY = '#0f2a4a'
const NAVY_SOFT = '#1d456e'
const LINE = '#cbd5e1'
const LINE_SOFT = '#e2e8f0'
const INK = '#1f2937'
const MUTE = '#64748b'
const HEAD_BG = '#f1f5f9'

function InvoiceLogo() {
  return (
    <svg viewBox="0 0 32 32" width="44" height="44" aria-hidden>
      <rect width="32" height="32" rx="9" fill={NAVY} />
      <g stroke="#ffffff" strokeWidth="3.6" strokeLinecap="round">
        <path d="M16 8v16" />
        <path d="M8 16h16" />
      </g>
    </svg>
  )
}

const th: React.CSSProperties = {
  border: `1px solid ${LINE}`,
  padding: '4px 8px',
  fontSize: 9.5,
  fontWeight: 600,
  textTransform: 'uppercase',
  textAlign: 'left',
  color: '#fff',
  background: NAVY,
}
function td(align: 'left' | 'right' = 'left', bold = false): React.CSSProperties {
  return {
    border: `1px solid ${LINE}`,
    padding: '4px 8px',
    fontSize: 10.5,
    verticalAlign: 'top',
    textAlign: align,
    fontWeight: bold ? 600 : 400,
    color: INK,
  }
}

export function TaxInvoice({ data }: { data: ComputedInvoice }) {
  const cgstSgst = data.intraState

  return (
    <div
      id="tax-invoice"
      style={{
        width: '210mm',
        maxWidth: '100%',
        margin: '0 auto',
        background: '#fff',
        color: INK,
        padding: '12mm',
        fontSize: 11,
        lineHeight: 1.45,
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      {/* Badge */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <span style={{ border: `1px solid ${NAVY}`, color: NAVY, padding: '2px 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderRadius: 3 }}>
          Original for Recipient
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `2px solid ${NAVY}`, paddingBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <InvoiceLogo />
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: NAVY, margin: 0 }}>{SITE.legalName}</p>
            <p style={{ fontSize: 10, color: MUTE, margin: '2px 0 0', maxWidth: '78mm' }}>
              {SITE.contact.address.line1}, {SITE.contact.address.locality}, {SITE.contact.address.region} - {SITE.contact.address.postalCode}
            </p>
            <p style={{ fontSize: 10, color: MUTE, margin: '2px 0 0' }}>
              GSTIN: {SITE.legal.gstin} &nbsp;|&nbsp; CIN: {SITE.legal.cin} &nbsp;|&nbsp; PAN: {SITE.legal.pan}
            </p>
            <p style={{ fontSize: 10, color: MUTE, margin: '2px 0 0' }}>
              {SITE.contact.email} &nbsp;|&nbsp; {SITE.contact.phone}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: -0.5 }}>TAX INVOICE</h1>
          <p style={{ fontSize: 10, color: MUTE, margin: '2px 0 0' }}>Marketplace-facilitated B2B supply</p>
        </div>
      </div>

      {/* Meta */}
      <div style={{ marginTop: 12, border: `1px solid ${LINE}`, borderRadius: 4, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <Meta label="Invoice No." value={data.number} />
        <Meta label="Invoice Date" value={data.date} />
        <Meta label="Due Date" value={data.dueDate ?? '—'} />
        <Meta label="Reference PO" value={data.orderNumber} bottomless />
        <Meta label="Place of Supply" value={data.placeOfSupply} bottomless />
        <Meta label="Supply Type" value={data.supplyType} bottomless last />
      </div>

      {/* Parties */}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Party title="Supplier (Sold By)" p={data.supplier} extra={data.supplier.cin ? `CIN: ${data.supplier.cin}` : undefined} />
        <Party title="Recipient (Billed To)" p={data.recipient} />
      </div>

      {/* Line items */}
      <table style={{ marginTop: 12, width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['#', 'Medicine / Product', 'HSN', 'Batch', 'Exp.', 'Qty', 'Unit', 'Rate', 'Disc %', 'GST %', 'Taxable', 'Amount'].map((h) => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.lines.map((l) => (
            <tr key={l.sno}>
              <td style={td()}>{l.sno}</td>
              <td style={td('left', true)}>{l.name}</td>
              <td style={td()}>{l.hsn}</td>
              <td style={td()}>{l.batch}</td>
              <td style={td()}>{l.expiry}</td>
              <td style={td('right')}>{l.qty}</td>
              <td style={td()}>{l.unit}</td>
              <td style={td('right')}>{formatINR(l.rate)}</td>
              <td style={td('right')}>{l.discountPct}%</td>
              <td style={td('right')}>{l.gstPct}%</td>
              <td style={td('right')}>{formatINR(l.taxable)}</td>
              <td style={td('right', true)}>{formatINR(l.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals + words + bank */}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 72mm', gap: 16 }}>
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 4, padding: 8, fontSize: 10.5 }}>
          <p style={{ margin: 0, fontWeight: 600, color: NAVY }}>Amount Chargeable (in words)</p>
          <p style={{ margin: '4px 0 0', color: INK }}>{data.amountInWords}</p>
          <p style={{ margin: '12px 0 0', fontWeight: 600, color: NAVY }}>Bank Details</p>
          {data.bank.name || data.bank.account ? (
            <div style={{ marginTop: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', color: INK }}>
              <span>Bank: {data.bank.name ?? '—'}</span>
              <span>A/C: {data.bank.account ?? '—'}</span>
              <span>IFSC: {data.bank.ifsc ?? '—'}</span>
              <span>Branch: {data.bank.branch ?? '—'}</span>
            </div>
          ) : (
            <p style={{ marginTop: 4, color: MUTE }}>Supplier has not added bank details. Contact the supplier for payment instructions.</p>
          )}
        </div>

        <table style={{ borderCollapse: 'collapse', width: '100%', height: 'fit-content', fontSize: 10.5 }}>
          <tbody>
            <TotalRow label="Taxable Value" value={data.totals.taxable} />
            {data.totals.discount > 0 ? <TotalRow label="Total Discount" value={-data.totals.discount} /> : null}
            {cgstSgst ? (
              <>
                <TotalRow label="CGST" value={data.totals.cgst} />
                <TotalRow label="SGST" value={data.totals.sgst} />
              </>
            ) : (
              <TotalRow label="IGST" value={data.totals.igst} />
            )}
            {data.totals.roundOff !== 0 ? <TotalRow label="Round Off" value={data.totals.roundOff} /> : null}
            <tr>
              <td style={{ border: `1px solid ${LINE}`, padding: '6px 8px', fontWeight: 700, color: '#fff', background: NAVY }}>Total Payable</td>
              <td style={{ border: `1px solid ${LINE}`, padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#fff', background: NAVY }}>
                {formatINR(data.totals.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* HSN breakup */}
      <div style={{ marginTop: 12 }}>
        <p style={{ margin: '0 0 4px', fontSize: 10.5, fontWeight: 600, color: NAVY }}>Tax Breakup by HSN / SAC</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr>
              {['HSN/SAC', 'Taxable Value', 'GST %', cgstSgst ? 'CGST' : 'IGST', cgstSgst ? 'SGST' : null, 'Total Tax']
                .filter(Boolean)
                .map((h) => (
                  <th key={h as string} style={{ border: `1px solid ${LINE}`, padding: '4px 8px', textAlign: 'left', fontWeight: 600, background: HEAD_BG, color: INK }}>
                    {h}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {data.hsn.map((r) => (
              <tr key={`${r.hsn}-${r.gstPct}`}>
                <td style={td()}>{r.hsn}</td>
                <td style={td('right')}>{formatINR(r.taxable)}</td>
                <td style={td('right')}>{r.gstPct}%</td>
                {cgstSgst ? (
                  <>
                    <td style={td('right')}>{formatINR(r.cgst)}</td>
                    <td style={td('right')}>{formatINR(r.sgst)}</td>
                  </>
                ) : (
                  <td style={td('right')}>{formatINR(r.igst)}</td>
                )}
                <td style={td('right', true)}>{formatINR(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Terms + signature */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ fontSize: 9.5, color: MUTE }}>
          <p style={{ margin: 0, fontWeight: 600, color: NAVY }}>Terms &amp; Conditions</p>
          <ol style={{ margin: '4px 0 0', paddingLeft: 16, lineHeight: 1.5 }}>
            <li>Goods once sold will not be taken back or exchanged except for defects notified within 48 hours.</li>
            <li>Payment due as per agreed credit terms; interest @18% p.a. on overdue amounts.</li>
            <li>All disputes subject to {data.supplier.state} jurisdiction.</li>
            <li>Storage and handling of medicines must comply with the Drugs &amp; Cosmetics Act, 1940.</li>
            <li>This is a computer-generated invoice facilitated by {SITE.name} and does not require a physical stamp.</li>
          </ol>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', textAlign: 'right', fontSize: 10 }}>
          <p style={{ margin: 0, color: MUTE }}>For <span style={{ fontWeight: 600, color: INK }}>{data.supplier.name}</span></p>
          <div style={{ marginTop: 40 }}>
            <div style={{ width: '55mm', borderTop: `1px solid ${MUTE}` }} />
            <p style={{ margin: '4px 0 0', fontWeight: 600, color: NAVY }}>Authorised Signatory</p>
          </div>
        </div>
      </div>

      <p style={{ marginTop: 16, borderTop: `1px solid ${LINE_SOFT}`, paddingTop: 8, textAlign: 'center', fontSize: 9, color: MUTE }}>
        Generated via {SITE.name} — {SITE.url.replace(/^https?:\/\//, '')}. This invoice records a supply between the Supplier
        and Recipient named above.
      </p>
    </div>
  )
}

function Meta({ label, value, last = false, bottomless = false }: { label: string; value: string; last?: boolean; bottomless?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '6px 10px',
        borderRight: last ? 'none' : `1px solid ${LINE_SOFT}`,
        borderBottom: bottomless ? 'none' : `1px solid ${LINE_SOFT}`,
      }}
    >
      <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.4, color: MUTE }}>{label}</span>
      <span style={{ fontWeight: 600, color: INK }}>{value}</span>
    </div>
  )
}

function Party({
  title,
  p,
  extra,
}: {
  title: string
  p: { name: string; address: string; phone: string | null; gstin: string | null; state: string }
  extra?: string
}) {
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 4, padding: 8 }}>
      <p style={{ margin: 0, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: NAVY }}>{title}</p>
      <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: '#0f172a' }}>{p.name}</p>
      <p style={{ margin: '2px 0 0', fontSize: 10, color: MUTE }}>{p.address}</p>
      <p style={{ margin: '4px 0 0', fontSize: 10, color: MUTE }}>
        GSTIN: {p.gstin ?? 'Unregistered'} &nbsp;|&nbsp; State: {p.state}
      </p>
      {p.phone ? <p style={{ margin: '2px 0 0', fontSize: 10, color: MUTE }}>Phone: {p.phone}</p> : null}
      {extra ? <p style={{ margin: '2px 0 0', fontSize: 10, color: MUTE }}>{extra}</p> : null}
    </div>
  )
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <tr>
      <td style={{ border: `1px solid ${LINE}`, padding: '4px 8px', color: MUTE }}>{label}</td>
      <td style={{ border: `1px solid ${LINE}`, padding: '4px 8px', textAlign: 'right' }}>{formatINR(value)}</td>
    </tr>
  )
}
