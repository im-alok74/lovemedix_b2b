import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, 'Email is too short')
  .max(255)
  .email('Enter a valid email address')

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be under 128 characters')
  .refine((v) => /[a-z]/.test(v), 'Include at least one lowercase letter')
  .refine((v) => /[A-Z]/.test(v), 'Include at least one uppercase letter')
  .refine((v) => /\d/.test(v), 'Include at least one number')

export const gstSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/,
    'Enter a valid 15-character GSTIN',
  )

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2, 'Enter your full name').max(150),
  phone: phoneSchema,
  userType: z.enum(['pharmacy', 'distributor'], {
    message: 'Choose a valid account type',
  }),
})

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password').max(128),
})

export const pharmacyRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(150),
  phone: phoneSchema,
  pharmacyName: z.string().trim().min(2).max(255),
  registrationNumber: z.string().trim().max(100).optional().nullable(),
  gstNumber: gstSchema.optional().nullable(),
  contactPerson: z.string().trim().max(150).optional().nullable(),
  addressLine1: z.string().trim().min(5).max(255),
  addressLine2: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'),
  drugLicenseNumber: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  licenseExpiry: z.string().trim().optional().nullable().or(z.literal('')),
})

export const distributorRegisterSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().optional(),
    fullName: z.string().trim().min(2).max(150),
    phone: phoneSchema,
    companyName: z.string().trim().min(2).max(255),
    businessLicense: z.string().trim().max(100).optional().nullable().or(z.literal('')),
    drugLicenseNumber: z.string().trim().max(100).optional().nullable().or(z.literal('')),
    licenseExpiry: z.string().trim().optional().nullable().or(z.literal('')),
    gstNumber: gstSchema.optional().nullable().or(z.literal('')),
    contactPerson: z.string().trim().max(150).optional().nullable().or(z.literal('')),
    addressLine1: z.string().trim().min(5).max(255),
    addressLine2: z.string().trim().max(255).optional().nullable().or(z.literal('')),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'),
    minOrderValue: z.coerce.number().min(0).max(10_000_000).optional().default(0),
    cin: z.string().trim().max(30).optional().nullable().or(z.literal('')),
    bankName: z.string().trim().max(120).optional().nullable().or(z.literal('')),
    bankAccountNumber: z.string().trim().max(40).optional().nullable().or(z.literal('')),
    bankIfsc: z.string().trim().max(20).optional().nullable().or(z.literal('')),
    bankBranch: z.string().trim().max(120).optional().nullable().or(z.literal('')),
  })
  .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

/** Documents attached to a pharmacy/distributor profile during or after registration. */
export const documentUploadSchema = z.object({
  documentType: z.enum([
    'DRUG_LICENSE',
    'GST_CERTIFICATE',
    'BUSINESS_REGISTRATION',
    'ADDRESS_PROOF',
    'IDENTITY_PROOF',
    'OTHER',
  ]),
  fileName: z.string().trim().min(1).max(255),
  fileUrl: z.string().trim().url().max(500),
  fileSize: z.coerce.number().int().positive().optional().nullable(),
  mimeType: z.string().trim().max(100).optional().nullable(),
  expiresAt: z.string().trim().optional().nullable().or(z.literal('')),
})

// --- Admin -------------------------------------------------------------------

export const verificationActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'suspend', 'reinstate']),
  reason: z.string().trim().max(500).optional().nullable(),
})

export const documentActionSchema = z.object({
  action: z.enum(['verify', 'reject']),
  reason: z.string().trim().max(500).optional().nullable(),
})

const optionalString = z.string().trim().max(255).optional().nullable().or(z.literal(''))

export const medicineSchema = z.object({
  name: z.string().trim().min(2).max(255),
  genericName: optionalString,
  manufacturer: optionalString,
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  form: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  strength: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  packSize: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  hsnCode: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  mrp: z.coerce.number().min(0).max(1_000_000),
  gstRate: z.coerce.number().min(0).max(28).optional().default(5),
  requiresPrescription: z.coerce.boolean().optional().default(false),
  description: z.string().trim().max(4000).optional().nullable().or(z.literal('')),
  photoUrl: z.string().trim().url().max(500).optional().nullable().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']).optional().default('ACTIVE'),
})

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  displayOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
  isActive: z.coerce.boolean().optional().default(true),
})

export const userUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  fullName: z.string().trim().min(2).max(150).optional(),
  phone: phoneSchema.optional(),
})

export const settingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().trim().min(1).max(100),
      value: z.string().max(2000).nullable(),
    }),
  ).min(1).max(100),
})

// --- Distributor listings ----------------------------------------------------

export const listingSchema = z.object({
  medicineId: z.coerce.number().int().positive(),
  batchNumber: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  mfgDate: z.string().trim().optional().nullable().or(z.literal('')),
  expiryDate: z.string().trim().min(1, 'Expiry date is required'),
  mrp: z.coerce.number().min(0).max(1_000_000),
  unitPrice: z.coerce.number().min(0).max(1_000_000),
  quantity: z.coerce.number().int().min(0).max(10_000_000),
  minOrderQuantity: z.coerce.number().int().min(1).max(1_000_000).optional().default(1),
  hsnCode: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  isActive: z.coerce.boolean().optional().default(true),
})

// --- Pharmacy: purchase orders, requests, inventory, customers, sales --------

export const purchaseOrderSchema = z.object({
  distributorId: z.coerce.number().int().positive(),
  pharmacyNote: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  expectedBy: z.string().trim().optional().nullable().or(z.literal('')),
  items: z
    .array(
      z.object({
        distributorListingId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1).max(1_000_000),
      }),
    )
    .min(1, 'Add at least one item'),
})

export const purchaseOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED']),
  note: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
})

export const medicineRequestSchema = z.object({
  kind: z.enum(['OUT_OF_STOCK', 'NEW_MEDICINE']),
  medicineId: z.coerce.number().int().positive().optional().nullable(),
  distributorId: z.coerce.number().int().positive().optional().nullable(),
  requestedName: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  manufacturer: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  strength: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  packSize: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  requestedQuantity: z.coerce.number().int().min(1).max(1_000_000).optional().default(1),
  notes: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
})

export const inventorySchema = z.object({
  medicineId: z.coerce.number().int().positive(),
  batchNumber: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  mfgDate: z.string().trim().optional().nullable().or(z.literal('')),
  expiryDate: z.string().trim().optional().nullable().or(z.literal('')),
  mrp: z.coerce.number().min(0).max(1_000_000),
  costPrice: z.coerce.number().min(0).max(1_000_000).optional().default(0),
  sellingPrice: z.coerce.number().min(0).max(1_000_000),
  quantity: z.coerce.number().int().min(0).max(10_000_000),
  reorderLevel: z.coerce.number().int().min(0).max(1_000_000).optional().default(0),
  isActive: z.coerce.boolean().optional().default(true),
})

export const customerSchema = z.object({
  name: z.string().trim().min(2).max(150),
  phone: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal('')),
  address: z.string().trim().max(500).optional().nullable().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
})

export const saleSchema = z.object({
  customerId: z.coerce.number().int().positive().optional().nullable(),
  customerName: z.string().trim().max(150).optional().nullable().or(z.literal('')),
  customerPhone: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  paymentMethod: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  amountPaid: z.coerce.number().min(0).optional().default(0),
  discountAmount: z.coerce.number().min(0).optional().default(0),
  prescriptionRef: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  items: z
    .array(
      z.object({
        inventoryId: z.coerce.number().int().positive().optional().nullable(),
        medicineId: z.coerce.number().int().positive(),
        description: z.string().trim().min(1).max(255),
        quantity: z.coerce.number().int().min(1).max(1_000_000),
        unitPrice: z.coerce.number().min(0).max(1_000_000),
        discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
        gstRate: z.coerce.number().min(0).max(28).optional().default(0),
        batchNumber: z.string().trim().max(100).optional().nullable().or(z.literal('')),
      }),
    )
    .min(1, 'Add at least one item'),
})

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input'
}

export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): { ok: true; data: z.infer<T> } | { ok: false; error: string; issues: z.ZodIssue[] } {
  const result = schema.safeParse(data)
  if (result.success) return { ok: true, data: result.data }
  return { ok: false, error: firstIssue(result.error), issues: result.error.issues }
}
