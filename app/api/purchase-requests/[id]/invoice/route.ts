import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const requestId = Number(id)
    if (Number.isNaN(requestId)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 })
    }

    const requestRows = await sql`
      SELECT
        pr.*,
        inv.invoice_number,
        inv.payment_status AS invoice_payment_status,
        pp.pharmacy_name,
        pp.gst_number AS pharmacy_gst,
        pp.address AS pharmacy_address,
        pp.city AS pharmacy_city,
        pp.state AS pharmacy_state,
        pp.pincode AS pharmacy_pincode,
        dp.company_name AS distributor_name,
        dp.tax_id AS distributor_tax_id,
        dp.phone_number AS distributor_phone,
        dp.address_line1 AS distributor_address_line1,
        dp.address_line2 AS distributor_address_line2,
        dp.city AS distributor_city,
        dp.state_province AS distributor_state,
        dp.postal_code AS distributor_postal_code
      FROM purchase_requests pr
      JOIN pharmacy_profiles pp ON pr.pharmacy_id = pp.id
      JOIN distributor_profiles dp ON pr.distributor_id = dp.id
      LEFT JOIN purchase_invoices inv ON inv.request_id = pr.id
      WHERE pr.id = ${requestId}
      LIMIT 1
    `

    if (!requestRows.length) {
      return NextResponse.json({ error: "Purchase request not found" }, { status: 404 })
    }

    const pr = requestRows[0] as any

    // Authorization for procurement invoice visibility
    if (user.user_type === "pharmacy") {
      const pharmacyRows = await sql`
        SELECT id FROM pharmacy_profiles WHERE user_id = ${user.id}
      `
      if (!pharmacyRows.length || Number((pharmacyRows[0] as any).id) !== Number(pr.pharmacy_id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (user.user_type === "distributor") {
      const distributorRows = await sql`
        SELECT id FROM distributor_profiles WHERE user_id = ${user.id}
      `
      if (!distributorRows.length || Number((distributorRows[0] as any).id) !== Number(pr.distributor_id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (user.user_type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const items = await sql`
      SELECT
        pi.quantity,
        pi.price,
        pi.line_total,
        pi.batch_number,
        pi.expiry_date,
        m.name AS medicine_name,
        m.generic_name,
        m.manufacturer
      FROM purchase_items pi
      JOIN medicines m ON pi.medicine_id = m.id
      WHERE pi.request_id = ${requestId}
      ORDER BY m.name ASC
    `

    const subtotal = Number(pr.total_amount || 0)
    const invoiceNumber = pr.invoice_number || `PR-${pr.id}`

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Procurement Invoice ${invoiceNumber}</title>
        <style>
          :root {
            --bg: #f5f7fb;
            --card: #ffffff;
            --text: #1f2937;
            --muted: #6b7280;
            --line: #e5e7eb;
            --brand: #0f766e;
            --brand-soft: #ccfbf1;
            --good: #166534;
            --good-bg: #dcfce7;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: radial-gradient(circle at 10% 10%, #e8fff8 0%, var(--bg) 45%), var(--bg);
            color: var(--text);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            padding: 24px;
          }
          .toolbar {
            position: sticky;
            top: 0;
            z-index: 10;
            max-width: 980px;
            margin: 0 auto 12px auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(8px);
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 10px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }
          .toolbar button {
            border: 1px solid var(--line);
            background: #fff;
            color: var(--text);
            padding: 8px 12px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }
          .toolbar button.primary {
            background: var(--brand);
            color: #fff;
            border-color: var(--brand);
          }
          .invoice {
            max-width: 980px;
            margin: 0 auto;
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 18px;
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
            overflow: hidden;
          }
          .hero {
            padding: 22px 24px;
            background: linear-gradient(135deg, #0f766e 0%, #0ea5a4 100%);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
          }
          .hero-title { font-size: 24px; font-weight: 800; letter-spacing: 0.2px; }
          .hero-sub { margin-top: 4px; opacity: 0.92; }
          .status-chip {
            display: inline-block;
            margin-top: 8px;
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            background: rgba(255, 255, 255, 0.2);
          }
          .content { padding: 20px 24px 24px 24px; }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 16px;
          }
          .meta-card {
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 12px;
            background: #fff;
          }
          .meta-card .k { color: var(--muted); font-size: 12px; }
          .meta-card .v { font-weight: 700; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
          .box {
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 14px;
            background: #fff;
            min-height: 128px;
          }
          .box h3 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: var(--muted); letter-spacing: 0.4px; }
          .box .name { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
          .muted { color: var(--muted); }
          table { width: 100%; border-collapse: separate; border-spacing: 0; }
          th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid var(--line); vertical-align: top; }
          th { background: #f8fafc; font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.25px; }
          th:first-child { border-top-left-radius: 10px; }
          th:last-child { border-top-right-radius: 10px; }
          .text-right { text-align: right; }
          .medicine-name { font-weight: 700; }
          .summary { margin-top: 16px; display: flex; justify-content: flex-end; }
          .summary-box {
            width: 320px;
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 12px;
            background: #fff;
          }
          .row { display: flex; justify-content: space-between; padding: 6px 0; }
          .row.total {
            margin-top: 8px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 10px;
            font-size: 16px;
            font-weight: 800;
            color: var(--good);
          }
          .footer {
            margin-top: 18px;
            border-top: 1px solid var(--line);
            padding-top: 12px;
            text-align: center;
            color: var(--muted);
          }
          .paid-pill {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            color: var(--good);
            background: var(--good-bg);
            padding: 4px 8px;
            border-radius: 999px;
          }

          @media print {
            body { background: #fff; padding: 0; }
            .toolbar { display: none; }
            .invoice { box-shadow: none; border: none; border-radius: 0; max-width: 100%; }
            .hero { border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button onclick="window.print()" class="primary">Print Invoice</button>
          <button onclick="window.close()">Close</button>
        </div>
        <div class="invoice">
          <div class="hero">
            <div>
              <div class="hero-title">Davaa.in Procurement Invoice</div>
              <div class="hero-sub">Pharmacy and Distributor transaction record</div>
              <div class="status-chip">Request PR-${pr.id}</div>
            </div>
            <div style="text-align:right;">
              <div><strong>Invoice:</strong> ${invoiceNumber}</div>
              <div><strong>Date:</strong> ${new Date(pr.created_at).toLocaleDateString("en-IN")}</div>
              <div style="margin-top:8px;"><span class="paid-pill">${pr.invoice_payment_status || "UNPAID"}</span></div>
            </div>
          </div>

          <div class="content">
            <div class="meta-grid">
              <div class="meta-card">
                <div class="k">Request Status</div>
                <div class="v">${pr.status}</div>
              </div>
              <div class="meta-card">
                <div class="k">Total Items</div>
                <div class="v">${(items as any[]).length}</div>
              </div>
              <div class="meta-card">
                <div class="k">Grand Total</div>
                <div class="v">₹${subtotal.toFixed(2)}</div>
              </div>
            </div>

            <div class="grid">
              <div class="box">
                <h3>Pharmacy (Buyer)</h3>
                <div class="name">${pr.pharmacy_name || "N/A"}</div>
                <div>${pr.pharmacy_address || ""}</div>
                <div>${pr.pharmacy_city || ""}, ${pr.pharmacy_state || ""} - ${pr.pharmacy_pincode || ""}</div>
                <div class="muted" style="margin-top:8px;">GST: ${pr.pharmacy_gst || "N/A"}</div>
              </div>
              <div class="box">
                <h3>Distributor (Seller)</h3>
                <div class="name">${pr.distributor_name || "N/A"}</div>
                <div>${pr.distributor_address_line1 || ""} ${pr.distributor_address_line2 || ""}</div>
                <div>${pr.distributor_city || ""}, ${pr.distributor_state || ""} - ${pr.distributor_postal_code || ""}</div>
                <div class="muted" style="margin-top:8px;">Tax ID: ${pr.distributor_tax_id || "N/A"} | Phone: ${pr.distributor_phone || "N/A"}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Expiry</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${
                  (items as any[])
                    .map((item) => {
                      const exp = item.expiry_date
                        ? new Date(item.expiry_date).toLocaleDateString("en-IN")
                        : "N/A"
                      return `
                        <tr>
                          <td>
                            <div class="medicine-name">${item.medicine_name}</div>
                            <div class="muted">${item.generic_name || ""} ${item.manufacturer ? `| ${item.manufacturer}` : ""}</div>
                          </td>
                          <td>${item.batch_number || "N/A"}</td>
                          <td>${exp}</td>
                          <td class="text-right">${item.quantity}</td>
                          <td class="text-right">₹${Number(item.price || 0).toFixed(2)}</td>
                          <td class="text-right">₹${Number(item.line_total || 0).toFixed(2)}</td>
                        </tr>
                      `
                    })
                    .join("")
                }
              </tbody>
            </table>

            <div class="summary">
              <div class="summary-box">
                <div class="row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
                <div class="row"><span>Taxes</span><span>Included/As per agreement</span></div>
                <div class="row"><span>Freight</span><span>As billed</span></div>
                <div class="row total"><span>Total</span><span>₹${subtotal.toFixed(2)}</span></div>
              </div>
            </div>

            <div class="footer">
              This is a computer-generated procurement invoice for pharmacy-distributor transactions.<br/>
              Generated on ${new Date().toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return new NextResponse(invoiceHTML, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="Procurement_Invoice_${invoiceNumber}.html"`,
      },
    })
  } catch (error) {
    console.error("[PROCUREMENT INVOICE] Error:", error)
    return NextResponse.json({ error: "Failed to generate procurement invoice" }, { status: 500 })
  }
}
