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
  licenseNumber: z.string().trim().max(100).optional().nullable(),
})

export const distributorRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z.string().trim().min(2).max(150),
  phone: phoneSchema,
  companyName: z.string().trim().min(2).max(255),
  businessLicense: z.string().trim().max(100),
  taxId: z.string().trim().max(50),
  addressLine1: z.string().trim().min(5).max(255),
  addressLine2: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'),
  serviceRadiusKm: z.coerce.number().int().positive().max(5000).optional().default(50),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
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
