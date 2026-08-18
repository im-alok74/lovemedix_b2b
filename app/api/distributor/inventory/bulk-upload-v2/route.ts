import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"
import * as XLSX from "xlsx"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

type UploadRow = {
  medicine_id?: number | string
  medicine_name?: string
  generic_name?: string
  manufacturer?: string
  category?: string
  strength?: string
  form?: string
  pack_size?: string
  description?: string
  side_effects?: string
  precautions?: string
  requires_prescription?: boolean | string | number
  hsn_code?: number | string
  mfg_date?: string
  image_base64?: string
  batch_number?: string
  expiry_date?: string
  mrp?: number | string
  quantity?: number | string
  unit_price?: number | string
  notes?: string
  source?: string
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/\s+/g, "_")
}

function pickField(row: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    const normalized = normalizeKey(alias)
    if (row[normalized] !== undefined && row[normalized] !== null && String(row[normalized]).trim() !== "") {
      return row[normalized]
    }
  }
  return undefined
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toText(value: unknown) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

function toIsoDate(value: unknown) {
  if (!value) return null

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) {
      const month = String(parsed.m).padStart(2, "0")
      const day = String(parsed.d).padStart(2, "0")
      return `${parsed.y}-${month}-${day}`
    }
  }

  const str = String(value).trim()
  if (!str) return null

  const dmy = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    const day = Number(d)
    const month = Number(m)
    const year = Number(y)
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    }
  }

  const d = new Date(str)
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10)
  }

  return null
}

function parseFileRows(buffer: Buffer, fileName: string): UploadRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" })
  const firstSheetName = wb.SheetNames[0]
  if (!firstSheetName) return []

  const sheet = wb.Sheets[firstSheetName]
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })

  return jsonRows.map((r) => {
    const normalized: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(r)) {
      normalized[normalizeKey(k)] = v
    }

    const quantityRaw = pickField(normalized, ["quantity", "qty", "stock_quantity", "stock", "available_quantity"])
    const unitPriceRaw = pickField(normalized, ["unit_price", "wholesale_price", "purchase_price", "cost_price"])
    const mrpRaw = pickField(normalized, ["mrp", "price", "selling_price", "retail_price"])
    const expiryDateRaw = pickField(normalized, ["expiry_date", "expiry", "exp_date", "expirydt", "expiry_dt"])
    const mfgDateRaw = pickField(normalized, ["mfg_date", "manufacturing_date", "manufacture_date", "mfd_date"])
    const batchNumberRaw = pickField(normalized, ["batch_number", "batch", "batch_no", "lot_number"])
    const medicineNameRaw = pickField(normalized, ["medicine_name", "name", "medicine"])

    return {
      medicine_id: normalized.medicine_id as number | string | undefined,
      medicine_name: String(medicineNameRaw || "").trim(),
      generic_name: String(normalized.generic_name || "").trim(),
      manufacturer: String(normalized.manufacturer || "").trim(),
      category: String(normalized.category || "").trim(),
      strength: String(normalized.strength || "").trim(),
      form: String(normalized.form || "").trim(),
      pack_size: String(normalized.pack_size || "").trim(),
      description: String(normalized.description || "").trim(),
      side_effects: String(normalized.side_effects || "").trim(),
      precautions: String(normalized.precautions || "").trim(),
      requires_prescription:
        normalized.requires_prescription as boolean | string | number | undefined,
      hsn_code: normalized.hsn_code as number | string | undefined,
      mfg_date: String(mfgDateRaw || "").trim(),
      image_base64: String(normalized.image_base64 || normalized.image_url || "").trim(),
      batch_number: String(batchNumberRaw || "").trim(),
      expiry_date: String(expiryDateRaw || "").trim(),
      mrp: mrpRaw as number | string | undefined,
      quantity: quantityRaw as number | string | undefined,
      unit_price: unitPriceRaw as number | string | undefined,
      notes: String(normalized.notes || "").trim(),
      source: String(normalized.source || "").trim(),
    }
  })
}

async function uploadImageToCloudinary(base64Data: string): Promise<string | null> {
  try {
    if (!base64Data || base64Data.length === 0) return null

    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Data}`, {
      folder: "davaa/medicines",
      resource_type: "auto",
      quality: "auto",
      fetch_format: "auto",
    })

    return result.secure_url
  } catch (error) {
    console.error("[bulk-upload-v2] Image upload error:", error)
    return null
  }
}

async function resolveMedicineId(row: UploadRow) {
  const numericId = toNumber(row.medicine_id)
  if (numericId) {
    const byId = await sql`
      SELECT id, name, mrp
      FROM medicines
      WHERE id = ${numericId} AND status = 'active'
      LIMIT 1
    `
    if (byId.length > 0) {
      return byId[0] as any
    }
  }

  const medicineName = (row.medicine_name || "").trim()
  if (!medicineName) return null

  const strength = (row.strength || "").trim()

  const exact = await sql`
    SELECT id, name, mrp
    FROM medicines
    WHERE status = 'active'
      AND name ILIKE ${medicineName}
      AND (${strength === ""} OR COALESCE(strength, '') ILIKE ${strength})
    ORDER BY name ASC
    LIMIT 1
  `

  if (exact.length > 0) {
    return exact[0] as any
  }

  const fuzzy = await sql`
    SELECT id, name, mrp,
      GREATEST(
        similarity(COALESCE(name, ''), ${medicineName}),
        similarity(COALESCE(generic_name, ''), ${medicineName})
      ) AS score
    FROM medicines
    WHERE status = 'active'
      AND (
        name ILIKE ${`%${medicineName}%`}
        OR generic_name ILIKE ${`%${medicineName}%`}
      )
      AND (${strength === ""} OR COALESCE(strength, '') ILIKE ${strength})
    ORDER BY score DESC, name ASC
    LIMIT 1
  `

  if (fuzzy.length > 0) {
    return fuzzy[0] as any
  }

  return null
}

async function createNewMedicine(row: UploadRow, imageUrl: string | null) {
  const medicineName = (row.medicine_name || "").trim()
  if (!medicineName) throw new Error("Medicine name required for creation")

  const requiresPrescription =
    String(row.requires_prescription).toLowerCase() === "true" ||
    String(row.requires_prescription) === "1"

  const result = await sql`
    INSERT INTO medicines
    (
      name,
      generic_name,
      manufacturer,
      category,
      form,
      strength,
      pack_size,
      description,
      side_effects,
      precautions,
      requires_prescription,
      mrp,
      image_url,
      photo_url,
      status,
      source,
      hsn_code,
      mfg_date,
      popularity_score
    )
    VALUES
    (
      ${medicineName},
      ${(row.generic_name || "").trim() || null},
      ${(row.manufacturer || "").trim() || null},
      ${(row.category || "").trim() || null},
      ${(row.form || "").trim() || null},
      ${(row.strength || "").trim() || null},
      ${(row.pack_size || "").trim() || null},
      ${(row.description || "").trim() || null},
      ${(row.side_effects || "").trim() || null},
      ${(row.precautions || "").trim() || null},
      ${requiresPrescription},
      ${toNumber(row.mrp) ?? null},
      ${imageUrl},
      ${imageUrl},
      'active',
      ${row.source?.trim() || 'bulk_upload'},
      ${toText(row.hsn_code) ?? null},
      ${toIsoDate(row.mfg_date)},
      0
    )
    RETURNING id, name, mrp
  `

  if (result.length === 0) throw new Error("Failed to create medicine")
  return result[0] as any
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || user.user_type !== "distributor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await sql`
      SELECT id, verification_status
      FROM distributor_profiles
      WHERE user_id = ${user.id}
      LIMIT 1
    `

    if (profile.length === 0) {
      return NextResponse.json({ error: "Distributor profile not found" }, { status: 404 })
    }

    if ((profile[0] as any).verification_status !== "verified") {
      return NextResponse.json({ error: "Distributor not verified yet" }, { status: 403 })
    }

    const distributorId = (profile[0] as any).id

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const allowCreate = formData.get("allowCreate") === "true"

    if (!file) {
      return NextResponse.json({ error: "Please upload a CSV/XLSX file" }, { status: 400 })
    }

    const lowerName = file.name.toLowerCase()
    if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
      return NextResponse.json({ error: "Only .csv, .xls, .xlsx files are allowed" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const rows = parseFileRows(Buffer.from(bytes), file.name)

    if (rows.length === 0) {
      return NextResponse.json({ error: "No rows found in uploaded file" }, { status: 400 })
    }

    if (rows.length > 2000) {
      return NextResponse.json({ error: "Max 2000 rows per upload" }, { status: 400 })
    }

    const results: Array<{
      row: number
      medicineId?: number
      name?: string
      isNew?: boolean
      status: string
      message: string
    }> = []
    let successCount = 0
    let failureCount = 0
    let createdCount = 0
    const uploadedMedicineIds: number[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      try {
        let medicine = await resolveMedicineId(row)
        let isNewMedicine = false

        if (!medicine) {
          if (!allowCreate) {
            failureCount++
            results.push({
              row: i + 2,
              status: "error",
              message: "Medicine not found. Enable 'Create new medicines' to add it automatically.",
            })
            continue
          }

          let imageUrl: string | null = null
          if (row.image_base64) {
            imageUrl = await uploadImageToCloudinary(row.image_base64)
          }

          medicine = await createNewMedicine(row, imageUrl)
          isNewMedicine = true
          createdCount++
        }

        const medicineId = Number((medicine as any).id)
        const medicineName = String((medicine as any).name)

        const quantity = toNumber(row.quantity)
        const unitPrice = toNumber(row.unit_price)
        const mrp = toNumber(row.mrp) ?? toNumber((medicine as any).mrp)
        const expiryDate = toIsoDate(row.expiry_date)
        const mfgDate = toIsoDate(row.mfg_date)

        if (!quantity || quantity <= 0 || !unitPrice || unitPrice <= 0 || !expiryDate) {
          failureCount++
          results.push({
            row: i + 2,
            medicineId,
            name: medicineName,
            status: "error",
            message: "Missing required values: quantity, unit_price, expiry_date",
          })
          continue
        }

        const resolvedMrp = mrp ?? unitPrice

        const batchNumber = (row.batch_number || "").trim() || null
        const amount = quantity * unitPrice

        try {
          await sql`
            INSERT INTO distributor_medicines
            (
              distributor_id,
              medicine_id,
              batch_number,
              mfg_date,
              expiry_date,
              mrp,
              quantity,
              unit_price,
              amount,
              hsn_code,
              notes
            )
            VALUES
            (
              ${distributorId},
              ${medicineId},
              ${batchNumber},
              ${mfgDate},
              ${expiryDate},
              ${resolvedMrp},
              ${quantity},
              ${unitPrice},
              ${amount},
              ${toText(row.hsn_code) ?? null},
              ${(row.notes || "").trim() || null}
            )
          `
        } catch (insertError: any) {
          if (insertError.message?.includes("duplicate") || insertError.message?.includes("unique constraint")) {
            const updated = await sql`
              UPDATE distributor_medicines
              SET quantity = quantity + ${quantity},
                  amount = (quantity + ${quantity}) * unit_price,
                  expiry_date = ${expiryDate},
                  mrp = ${mrp},
                  mfg_date = ${mfgDate},
                  hsn_code = ${toText(row.hsn_code) ?? null},
                  notes = ${(row.notes || "").trim() || null},
                  updated_at = NOW()
              WHERE distributor_id = ${distributorId}
                AND medicine_id = ${medicineId}
                AND batch_number IS NOT DISTINCT FROM ${batchNumber}
              RETURNING id
            `

            if (updated.length === 0) {
              throw new Error("Duplicate detected but batch update failed")
            }
          } else {
            throw insertError
          }
        }

        successCount++
        uploadedMedicineIds.push(medicineId)
        results.push({
          row: i + 2,
          medicineId,
          name: medicineName,
          isNew: isNewMedicine,
          status: "success",
          message: isNewMedicine ? "Created & Added to Inventory" : "Added to Inventory",
        })
      } catch (rowError: any) {
        failureCount++
        results.push({
          row: i + 2,
          status: "error",
          message: rowError?.message || "Failed",
        })
      }
    }

    const source = lowerName.endsWith(".csv") ? "csv" : "xlsx"
    const overallStatus = successCount === 0 ? "failed" : failureCount === 0 ? "completed" : "partial"
    const medicineIdsLiteral = uploadedMedicineIds.length > 0
      ? `{${uploadedMedicineIds.join(",")}}`
      : "{}"

    try {
      await sql`
        INSERT INTO medicine_bulk_uploads
          (distributor_id, source, file_name, medicine_ids, upload_count, status, failure_count)
        VALUES
          (
            ${distributorId},
            ${source},
            ${file.name},
            ${medicineIdsLiteral},
            ${successCount},
            ${overallStatus},
            ${failureCount}
          )
      `
    } catch (auditError) {
      console.error("[bulk-upload-v2] Failed to store audit row:", auditError)
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      successCount,
      failureCount,
      createdCount,
      results,
    })
  } catch (error: any) {
    console.error("[bulk-upload-v2] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
