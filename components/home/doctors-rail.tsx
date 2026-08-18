import Link from "next/link"

import { DoctorCard } from "@/components/doctors/doctor-card"
import { findDoctors } from "@/lib/doctors"
import { getDeliveryLocation } from "@/lib/location-server"

/**
 * "Talk to a doctor" on the homepage.
 *
 * Renders nothing until real verified doctors exist. That is the point: the section
 * appears on its own the day the first doctor is onboarded, and until then the homepage
 * is simply shorter rather than carrying a heading over an apology.
 *
 * Doctors are still reachable from the header and footer meanwhile, where the empty state
 * on /doctors explains what is coming.
 */
export async function DoctorsRail() {
  const location = await getDeliveryLocation()
  const doctors = await findDoctors(location, {}, 4)

  if (doctors.length === 0) return null

  return (
    <section aria-labelledby="doctors-heading" className="py-8 sm:py-10">
      <div className="page-container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="doctors-heading" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Talk to a doctor
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Verified doctors for an online consultation or a clinic appointment near you.
            </p>
          </div>
          <Link href="/doctors" className="shrink-0 text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      </div>
    </section>
  )
}
