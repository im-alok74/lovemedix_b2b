// Optional demo data for local testing: one approved distributor + pharmacy,
// a handful of medicines, and listings. Run: node prisma/seed-demo.mjs
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'

for (const f of ['.env', '.env.local']) {
  try {
    for (const line of readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {}
}

const prisma = new PrismaClient()
const pw = await bcrypt.hash('Demo#2026', 12)

async function makeUser(email, fullName, role) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: pw, fullName, phone: '9876500000', role, status: 'ACTIVE' },
  })
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })

  const distUser = await makeUser('distributor@demo.in', 'Demo Distributor', 'DISTRIBUTOR')
  const distributor = await prisma.distributorProfile.upsert({
    where: { userId: distUser.id },
    update: { verificationStatus: 'VERIFIED' },
    create: {
      userId: distUser.id,
      companyName: 'Meridian Pharma Distributors',
      gstNumber: '27AAAPL1234C1ZV',
      drugLicenseNumber: 'MH-DL-2024-0099',
      phone: '9876500001',
      email: 'distributor@demo.in',
      addressLine1: '14 Industrial Estate',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      minOrderValue: 2000,
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      verifiedBy: admin?.id ?? null,
    },
  })

  const pharmUser = await makeUser('pharmacy@demo.in', 'Demo Pharmacy', 'PHARMACY')
  await prisma.pharmacyProfile.upsert({
    where: { userId: pharmUser.id },
    update: { verificationStatus: 'VERIFIED' },
    create: {
      userId: pharmUser.id,
      pharmacyName: 'Wellness Chemists',
      gstNumber: '07AABCW1234D1Z9',
      drugLicenseNumber: 'DL-2024-0456',
      phone: '9876500002',
      email: 'pharmacy@demo.in',
      addressLine1: '3 Market Road',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      verifiedBy: admin?.id ?? null,
    },
  })

  const cat = await prisma.category.findFirst({ where: { slug: 'antibiotics' } })
  const meds = [
    ['Amoxicillin', 'Amoxicillin', 'Cipla', '500 mg', 'Capsule', '10 capsules', 45.5, 12],
    ['Azithromycin', 'Azithromycin', 'Sun Pharma', '500 mg', 'Tablet', '3 tablets', 78.0, 12],
    ['Paracetamol', 'Paracetamol', 'GSK', '650 mg', 'Tablet', '15 tablets', 30.0, 12],
    ['Pantoprazole', 'Pantoprazole', 'Dr Reddy', '40 mg', 'Tablet', '10 tablets', 96.0, 12],
    ['Metformin', 'Metformin', 'USV', '500 mg', 'Tablet', '20 tablets', 24.0, 5],
  ]
  for (const [name, generic, mfr, strength, form, pack, mrp, gst] of meds) {
    const slug = `${name}-${strength}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const medicine = await prisma.medicine.upsert({
      where: { slug },
      update: {},
      create: {
        name, genericName: generic, manufacturer: mfr, strength, form, packSize: pack,
        mrp, gstRate: gst, categoryId: cat?.id ?? null, status: 'ACTIVE', slug,
      },
    })
    await prisma.distributorListing.upsert({
      where: { distributorId_medicineId_batchNumber: { distributorId: distributor.id, medicineId: medicine.id, batchNumber: 'B-DEMO-1' } },
      update: { quantity: 500, unitPrice: Number((mrp * 0.72).toFixed(2)) },
      create: {
        distributorId: distributor.id,
        medicineId: medicine.id,
        batchNumber: 'B-DEMO-1',
        expiryDate: new Date(Date.now() + 540 * 864e5),
        mrp,
        unitPrice: Number((mrp * 0.72).toFixed(2)),
        quantity: 500,
        minOrderQuantity: 10,
      },
    })
  }

  console.log('demo: distributor@demo.in / pharmacy@demo.in  (password Demo#2026)')
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
