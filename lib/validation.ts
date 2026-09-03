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
