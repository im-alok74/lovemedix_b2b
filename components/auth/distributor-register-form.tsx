"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface FormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phone: string
  companyName: string
  businessLicense: string
  taxId: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  serviceRadiusKm: string
}

export function DistributorRegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    companyName: "",
    businessLicense: "",
    taxId: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    serviceRadiusKm: "50",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const { toast } = useToast()

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!formData.fullName.trim()) errs.fullName = "Full name is required"
    if (!formData.email.trim()) errs.email = "Email is required"
    if (!formData.phone.trim()) errs.phone = "Phone is required"
    if (!formData.password || formData.password.length < 8) errs.password = "Password must be at least 8 characters"
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords do not match"
    if (!formData.companyName.trim()) errs.companyName = "Company name is required"
    if (!formData.businessLicense.trim()) errs.businessLicense = "Business license is required"
    if (!formData.taxId.trim()) errs.taxId = "Tax ID is required"
    if (!formData.addressLine1.trim()) errs.addressLine1 = "Address is required"
    if (!formData.city.trim()) errs.city = "City is required"
    if (!formData.state.trim()) errs.state = "State is required"
    if (!/^[1-9]\d{5}$/.test(formData.pincode)) errs.pincode = "Invalid pincode"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/distributor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, serviceRadiusKm: Number(formData.serviceRadiusKm) || 50 }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Success", description: "Registration submitted for review" })
        router.push("/distributor/dashboard")
        router.refresh()
      } else {
        toast({ title: "Error", description: data.error || "Registration failed", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required />
          {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="businessLicense">Business License</Label>
          <Input id="businessLicense" name="businessLicense" value={formData.businessLicense} onChange={handleChange} required />
          {errors.businessLicense && <p className="text-sm text-destructive">{errors.businessLicense}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID (GST)</Label>
          <Input id="taxId" name="taxId" value={formData.taxId} onChange={handleChange} required />
          {errors.taxId && <p className="text-sm text-destructive">{errors.taxId}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="addressLine1">Address</Label>
        <Input id="addressLine1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required />
        {errors.addressLine1 && <p className="text-sm text-destructive">{errors.addressLine1}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
        <Input id="addressLine2" name="addressLine2" value={formData.addressLine2} onChange={handleChange} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
          {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" value={formData.state} onChange={handleChange} required />
          {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} required />
          {errors.pincode && <p className="text-sm text-destructive">{errors.pincode}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Registering..." : "Register as Distributor"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/signin" className="text-primary hover:underline">Sign in</Link>
      </p>
    </form>
  )
}
