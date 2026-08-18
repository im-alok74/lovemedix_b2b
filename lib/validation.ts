import { z } from "zod"

/**
 * Shared input schemas. Every route that accepts user input should parse through one of
 * these rather than destructuring an untyped `await request.json()`.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "Email is too short")
  .max(255)
  .email("Enter a valid email address")

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode")

/**
 * Password rules. Deliberately favours length over symbol gymnastics — a 10-character
 * passphrase beats "P@ss1!" and users actually remember it.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be under 128 characters")
  .refine((v) => /[a-z]/.test(v), "Include at least one lowercase letter")
  .refine((v) => /[A-Z]/.test(v), "Include at least one uppercase letter")
  .refine((v) => /\d/.test(v), "Include at least one number")

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2, "Enter your full name").max(150),
  phone: phoneSchema,
  userType: z.enum(["customer", "pharmacy", "distributor"], {
    message: "Choose a valid account type",
  }),
})

export const signInSchema = z.object({
  email: emailSchema,
  // No strength rules on sign-in: existing passwords must keep working.
  password: z.string().min(1, "Enter your password").max(128),
})

export const gstSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/,
    "Enter a valid 15-character GSTIN",
  )

/** Turns a ZodError into the single most useful message for a toast. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input"
}

/**
 * Parses a body and returns a discriminated result instead of throwing, so routes can
 * return a 400 without a try/catch around every parse.
 */
export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): { ok: true; data: z.infer<T> } | { ok: false; error: string; issues: z.ZodIssue[] } {
  const result = schema.safeParse(data)
  if (result.success) return { ok: true, data: result.data }
  return { ok: false, error: firstIssue(result.error), issues: result.error.issues }
}
