import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { requirePharmacyProfile } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText } from 'lucide-react'

export default async function PharmacyPrescriptionsPage() {
  const { pharmacyId } = await requirePharmacyProfile()

  const profile = await sql`
    SELECT pharmacy_name FROM pharmacy_profiles WHERE id = ${pharmacyId} LIMIT 1
  `
  if (!profile.length) {
    redirect('/pharmacy/register')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Prescriptions</h1>
              <p className="text-muted-foreground mt-1">B2B procurement platform - prescriptions are not applicable</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/pharmacy/orders">
                <FileText className="mr-2 h-4 w-4" />
                View B2B Orders
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              This platform is for B2B pharmaceutical procurement. Prescription management is not part of the current workflow.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
