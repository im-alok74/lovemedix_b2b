"use client"

import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { FilterSection } from "./filter-section"
import { RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

const categories = ["Pain Relief", "Antibiotic", "Allergy", "Digestive", "Diabetes", "Cardiovascular", "Vitamin", "Respiratory"]
const priceOptions = [
  { label: "Under ₹100", value: "under-100" },
  { label: "₹100 - ₹500", value: "100-500" },
  { label: "₹500 - ₹1000", value: "500-1000" },
  { label: "₹1000+", value: "1000-plus" },
]
const manufacturerOptions = ["Cipla", "Sun Pharma", "Abbott", "Lupin", "Mankind", "Glenmark"]
const ratingOptions = [
  { label: "4+ stars", value: "4-plus" },
  { label: "4.5+ stars", value: "4.5-plus" },
]
const availabilityOptions = [
  { label: "In stock", value: "in-stock" },
  { label: "Out of stock", value: "out-of-stock" },
]
const prescriptionOptions = [
  { label: "Required", value: "required" },
  { label: "Not required", value: "not-required" },
]
const dosageOptions = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops"]
const discountOptions = [{ label: "Discounted", value: "yes" }]

export function MedicineFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    router.push(`/medicines${params.toString() ? `?${params.toString()}` : ""}`)
  }

  const clearAll = () => {
    router.push("/medicines")
  }

  return (
    <div className="rounded-[2rem] border border-border/70 bg-background/80 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Filters</p>
          <p className="text-sm text-muted-foreground">Refine your browse</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="h-8 px-2 text-muted-foreground">
          <RotateCcw className="mr-2 h-4 w-4" /> Clear
        </Button>
      </div>

      <div className="space-y-3">
        <FilterSection title="Category">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant={!searchParams.get("category") ? "default" : "outline"} className="rounded-full" onClick={() => updateFilter("category", null)}>
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                type="button"
                size="sm"
                variant={searchParams.get("category") === category ? "default" : "outline"}
                className="rounded-full"
                onClick={() => updateFilter("category", category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Price">
          <div className="flex flex-wrap gap-2">
            {priceOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={searchParams.get("price") === option.value ? "default" : "outline"}
                className="rounded-full"
                onClick={() => updateFilter("price", searchParams.get("price") === option.value ? null : option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Manufacturer">
          <div className="flex flex-wrap gap-2">
            {manufacturerOptions.map((manufacturer) => (
              <Button
                key={manufacturer}
                type="button"
                size="sm"
                variant={searchParams.get("manufacturer") === manufacturer ? "default" : "outline"}
                className="rounded-full"
                onClick={() => updateFilter("manufacturer", searchParams.get("manufacturer") === manufacturer ? null : manufacturer)}
              >
                {manufacturer}
              </Button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Rating">
          <div className="flex flex-wrap gap-2">
            {ratingOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={searchParams.get("rating") === option.value ? "default" : "outline"}
                className="rounded-full"
                onClick={() => updateFilter("rating", searchParams.get("rating") === option.value ? null : option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Availability">
          <div className="flex flex-wrap gap-2">
            {availabilityOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={searchParams.get("availability") === option.value ? "default" : "outline"}
                className="rounded-full"
                onClick={() => updateFilter("availability", searchParams.get("availability") === option.value ? null : option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Prescription Required">
          <div className="flex flex-wrap gap-2">
            {prescriptionOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={searchParams.get("prescription") === option.value ? "default" : "outline"}
                className="rounded-full"
                onClick={() => updateFilter("prescription", searchParams.get("prescription") === option.value ? null : option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Dosage Form">
          <div className="flex flex-wrap gap-2">
            {dosageOptions.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={searchParams.get("dosage") === option ? "default" : "outline"}
                className="rounded-full"
                onClick={() => updateFilter("dosage", searchParams.get("dosage") === option ? null : option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Discount">
          <div className="flex flex-wrap gap-2">
            {discountOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={searchParams.get("discount") === option.value ? "default" : "outline"}
                className="rounded-full"
                onClick={() => updateFilter("discount", searchParams.get("discount") === option.value ? null : option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  )
}
