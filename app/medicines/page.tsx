import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MedicineList } from "@/components/medicines/medicine-list"
import { MedicineFilters } from "@/components/medicines/medicine-filters"
import { MedicineToolbar } from "@/components/medicines/medicine-toolbar"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"

export const revalidate = 0
export const dynamic = "force-dynamic"

function MedicineListFallback() {
  return (
    <div className="space-y-4">
      <div className="h-20 rounded-3xl border border-border/70 bg-background/80" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-[1.75rem] border border-border/70 bg-background/80 p-4">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="mt-4 h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
            <Skeleton className="mt-4 h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

type MedicinesSearchParams = {
  search?: string
  category?: string
  group?: string
  brand?: string
}

export default async function MedicinesPage({
  searchParams,
}: {
  // Next 16 passes this as a Promise. It was typed as a plain object, and the toolbar then
  // did `typeof searchParams === "object" ? searchParams.search : ""` — which is `true` for
  // a Promise, so it read `.search` off the Promise itself and always got undefined. The
  // search box never pre-filled with the active query, and the sync property access is what
  // Next was reporting in the console.
  searchParams: Promise<MedicinesSearchParams>
}) {
  const resolvedSearchParams = await searchParams

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_50%),linear-gradient(135deg,_rgba(248,250,252,0.95),_rgba(255,255,255,1))]">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="mb-8 overflow-hidden rounded-[2rem] border border-border/70 bg-background/80 p-6 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="mb-3 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  Professional medicine discovery
                </p>
                <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                  Browse trusted medicines with confidence
                </h1>
                <p className="text-base leading-8 text-muted-foreground lg:text-lg">
                  Find high-quality medicines, compare offers, and place orders quickly without leaving your routine.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Fast, secure, and verified</span>
                <div className="mt-1">Trusted delivery from licensed pharmacies</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <MedicineToolbar initialQuery={resolvedSearchParams.search ?? ""} />
          </div>

          <div className="grid gap-8 lg:grid-cols-4">
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <MedicineFilters />
              </div>
            </aside>
            <div className="lg:col-span-3">
              <Suspense fallback={<MedicineListFallback />}>
                <MedicineList searchParams={resolvedSearchParams} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
