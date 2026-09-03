// Idempotent seed for Lovemedix B2B.
// Usage: node prisma/seed.mjs   (reads .env then .env.local)
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

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@lovemedix.in'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe#2026'

const CATEGORIES = [
  ['Antibiotics', 'antibiotics'],
  ['Cardiac Care', 'cardiac-care'],
  ['Diabetes Care', 'diabetes-care'],
  ['Pain Relief', 'pain-relief'],
  ['Gastrointestinal', 'gastrointestinal'],
  ['Respiratory', 'respiratory'],
  ['Dermatology', 'dermatology'],
  ['Vitamins & Supplements', 'vitamins-supplements'],
  ['Neurology', 'neurology'],
  ['Ophthalmology', 'ophthalmology'],
  ['Gynaecology', 'gynaecology'],
  ['Surgical & Consumables', 'surgical-consumables'],
]

const SETTINGS = [
  ['platform_name', 'Lovemedix', 'string', 'Marketplace display name'],
  ['support_email', 'support@lovemedix.in', 'string', 'Support contact'],
  ['gst_default_rate', '5', 'number', 'Default GST % applied to medicines'],
  ['pharmacy_auto_approve', 'false', 'boolean', 'Skip manual approval for pharmacies'],
  ['distributor_auto_approve', 'false', 'boolean', 'Skip manual approval for distributors'],
  ['purchase_order_prefix', 'PO', 'string', 'Prefix for purchase order numbers'],
  ['invoice_prefix', 'INV', 'string', 'Prefix for B2B invoice numbers'],
]

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL.toLowerCase() },
    update: {},
    create: {
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      fullName: 'Platform Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      adminProfile: { create: { role: 'SUPER_ADMIN' } },
    },
  })
  console.log(`admin: ${admin.email} (id ${admin.id})`)

  for (let i = 0; i < CATEGORIES.length; i++) {
    const [name, slug] = CATEGORIES[i]
    await prisma.category.upsert({
      where: { slug },
      update: { name, displayOrder: i },
      create: { name, slug, displayOrder: i },
    })
  }
  console.log(`categories: ${CATEGORIES.length}`)

  for (const [key, value, type, description] of SETTINGS) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: { description, type },
      create: { key, value, type, description },
    })
  }
  console.log(`settings: ${SETTINGS.length}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
