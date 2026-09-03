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
  fullName: string
  phone: string
  pharmacyName: string
  registrationNumber: string
  gstNumber: string
  contactPerson: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  licenseNumber: string
}

export function PharmacyRegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    pharmacyName: "",
    registrationNumber: "",
    gstNumber: "",
    contactPerson: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    licenseNumber: "",
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
    if (!formData.pharmacyName.trim()) errs.pharmacyName = "Pharmacy name is required"
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
      const res = await fetch("/api/pharmacy/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Success", description: "Registration submitted for review" })
        router.push("/pharmacy/dashboard")
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
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pharmacyName">Pharmacy Name</Label>
        <Input id="pharmacyName" name="pharmacyName" value={formData.pharmacyName} onChange={handleChange} required />
        {errors.pharmacyName && <p className="text-sm text-destructive">{errors.pharmacyName}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="registrationNumber">Registration Number</Label>
          <Input id="registrationNumber" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gstNumber">GST Number</Label>
          <Input id="gstNumber" name="gstNumber" value={formData.gstNumber} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="licenseNumber">Drug License Number</Label>
          <Input id="licenseNumber" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} />
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
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Registering..." : "Register as Pharmacy"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/signin" className="text-primary hover:underline">Sign in</Link>
      </p>
    </form>
  )
}
