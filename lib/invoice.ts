import type { Prisma } from '@prisma/client'

import { round2 } from '@/lib/money'
import { rupeesInWords } from '@/lib/num-to-words'

export type InvoicePayload = Prisma.InvoiceGetPayload<{
  include: {
    order: {
      include: {
        items: { include: { medicine: true } }
        pharmacy: true
        distributor: true
      }
    }
  }
}>

export interface InvoiceLine {
  sno: number
  name: string
  hsn: string
  batch: string
  expiry: string
  qty: number
  unit: string
  rate: number
  discountPct: number
  discountAmt: number
  gstPct: number
  taxable: number
  cgst: number
  sgst: number
  igst: number
  amount: number
}

export interface HsnRow {
  hsn: string
  taxable: number
  gstPct: number
  cgst: number
  sgst: number
  igst: number
  total: number
}

export interface ComputedInvoice {
  number: string
  date: string
  dueDate: string | null
  orderNumber: string
  intraState: boolean
  placeOfSupply: string
  supplyType: string
  supplier: {
    name: string
    address: string
    phone: string | null
    gstin: string | null
    state: string
    cin: string | null
  }
  recipient: {
    name: string
    address: string
    phone: string | null
    gstin: string | null
    state: string
  }
  bank: { name: string | null; account: string | null; ifsc: string | null; branch: string | null }
  lines: InvoiceLine[]
  hsn: HsnRow[]
  totals: {
    taxable: number
    discount: number
    cgst: number
    sgst: number
    igst: number
    roundOff: number
    total: number
  }
  amountInWords: string
}

function fmtDate(d: Date | null): string | null {
  return d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null
}

function addr(p: { addressLine1: string; addressLine2: string | null; city: string; state: string; pincode: string }) {
  return [p.addressLine1, p.addressLine2, `${p.city}, ${p.state} - ${p.pincode}`].filter(Boolean).join(', ')
}

export function computeInvoice(inv: InvoicePayload): ComputedInvoice {
  const { order } = inv
  const intraState =
    order.distributor.state.trim().toLowerCase() === order.pharmacy.state.trim().toLowerCase()

  const lines: InvoiceLine[] = order.items.map((it, i) => {
    const qty = it.quantity
    const rate = Number(it.unitPrice)
    const discPct = Number(it.discountPercent)
    const gstPct = Number(it.gstRate)
    const gross = round2(qty * rate)
    const discountAmt = round2((gross * discPct) / 100)
    const taxable = round2(gross - discountAmt)
    const tax = round2((taxable * gstPct) / 100)
    return {
      sno: i + 1,
      name: `${it.medicine.name}${it.medicine.strength ? ` ${it.medicine.strength}` : ''}${it.medicine.form ? ` ${it.medicine.form}` : ''}`,
      hsn: it.medicine.hsnCode || '3004',
      batch: it.batchNumber || '-',
      expiry: it.expiryDate ? it.expiryDate.toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' }) : '-',
      qty,
      unit: it.medicine.packSize ? `Pack (${it.medicine.packSize})` : 'Pack',
      rate,
      discountPct: discPct,
      discountAmt,
      gstPct,
      taxable,
      cgst: intraState ? round2(tax / 2) : 0,
      sgst: intraState ? round2(tax / 2) : 0,
      igst: intraState ? 0 : tax,
      amount: round2(taxable + tax),
    }
  })

  const hsnMap = new Map<string, HsnRow>()
  for (const l of lines) {
    const key = `${l.hsn}@${l.gstPct}`
    const row = hsnMap.get(key) ?? { hsn: l.hsn, gstPct: l.gstPct, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    row.taxable = round2(row.taxable + l.taxable)
    row.cgst = round2(row.cgst + l.cgst)
    row.sgst = round2(row.sgst + l.sgst)
    row.igst = round2(row.igst + l.igst)
    row.total = round2(row.total + l.cgst + l.sgst + l.igst)
    hsnMap.set(key, row)
  }

  const taxable = round2(lines.reduce((s, l) => s + l.taxable, 0))
  const discount = round2(lines.reduce((s, l) => s + l.discountAmt, 0))
  const cgst = round2(lines.reduce((s, l) => s + l.cgst, 0))
  const sgst = round2(lines.reduce((s, l) => s + l.sgst, 0))
  const igst = round2(lines.reduce((s, l) => s + l.igst, 0))
  const beforeRound = round2(taxable + cgst + sgst + igst)
  const total = Math.round(beforeRound)
  const roundOff = round2(total - beforeRound)

  const d = order.distributor
  return {
    number: inv.invoiceNumber,
    date: fmtDate(inv.invoiceDate)!,
    dueDate: fmtDate(inv.dueDate),
    orderNumber: order.orderNumber,
    intraState,
    placeOfSupply: order.pharmacy.state,
    supplyType: intraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)',
    supplier: {
      name: d.companyName,
      address: addr(d),
      phone: d.phone,
      gstin: d.gstNumber,
      state: d.state,
      cin: d.cin,
    },
    recipient: {
      name: order.pharmacy.pharmacyName,
      address: addr(order.pharmacy),
      phone: order.pharmacy.phone,
      gstin: order.pharmacy.gstNumber,
      state: order.pharmacy.state,
    },
    bank: {
      name: d.bankName,
      account: d.bankAccountNumber,
      ifsc: d.bankIfsc,
      branch: d.bankBranch,
    },
    lines,
    hsn: [...hsnMap.values()],
    totals: { taxable, discount, cgst, sgst, igst, roundOff, total },
    amountInWords: rupeesInWords(total),
  }
}
