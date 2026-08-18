import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import * as XLSX from "xlsx"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || user.user_type !== "distributor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create template data with example rows
    const templateData = [
      {
        medicine_id: "123 (optional - use if you know the ID)",
        medicine_name: "Aspirin (required - name or ID)",
        generic_name: "Acetylsalicylic acid",
        strength: "500mg",
        form: "tablet",
        batch_number: "B001",
        mfg_date: "01-01-2024",
        expiry_date: "31-12-2026",
        mrp: "100",
        quantity: "1000",
        unit_price: "50",
        hsn_code: "30051090",
        notes: "No specific storage instructions",
      },
      {
        medicine_id: "",
        medicine_name: "Paracetamol",
        generic_name: "Acetaminophen",
        strength: "650mg",
        form: "tablet",
        batch_number: "B002",
        mfg_date: "15-02-2024",
        expiry_date: "14-02-2027",
        mrp: "45",
        quantity: "500",
        unit_price: "22.50",
        hsn_code: "29413000",
        notes: "Keep in cool dry place",
      },
    ]

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(templateData, {
      header: [
        "medicine_id",
        "medicine_name",
        "generic_name",
        "strength",
        "form",
        "batch_number",
        "mfg_date",
        "expiry_date",
        "mrp",
        "quantity",
        "unit_price",
        "hsn_code",
        "notes",
      ],
    })

    // Set column widths for better readability
    const colWidths = [
      { wch: 25 }, // medicine_id
      { wch: 30 }, // medicine_name
      { wch: 25 }, // generic_name
      { wch: 15 }, // strength
      { wch: 12 }, // form
      { wch: 15 }, // batch_number
      { wch: 15 }, // mfg_date
      { wch: 15 }, // expiry_date
      { wch: 10 }, // mrp
      { wch: 12 }, // quantity
      { wch: 12 }, // unit_price
      { wch: 15 }, // hsn_code
      { wch: 25 }, // notes
    ]
    ws["!cols"] = colWidths

    // Add header row styling
    for (let i = 0; i < 13; i++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i })
      if (!ws[cellAddress]) continue
      ws[cellAddress].fill = { type: "pattern", pattern: "solid", fgColor: { rgb: "4472C4" } }
      ws[cellAddress].font = { bold: true, color: { rgb: "FFFFFF" } }
      ws[cellAddress].alignment = { horizontal: "center", vertical: "center" }
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Medicines Template"
    )

    // Create buffer
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })

    // Return as file download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="medicines_upload_template_${new Date().toISOString().split('T')[0]}.xlsx"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error: any) {
    console.error("[download-template] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
