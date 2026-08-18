import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PharmacyRegisterForm } from "@/components/pharmacy/pharmacy-register-form"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Clock3, ShieldCheck, Store } from "lucide-react"

export default function PharmacyRegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.1),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(248,250,252,1))] py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Store className="h-4 w-4" />
              Pharmacy partnership
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Grow your pharmacy with Davaa.in
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Join a trusted network that helps pharmacies reach more customers with a simpler fulfillment experience.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
              <CardContent className="p-6 lg:p-8">
                <div className="rounded-2xl border border-primary/20 bg-background/80 p-5">
                  <h2 className="text-xl font-semibold text-foreground">Why pharmacies partner with us</h2>
                  <div className="mt-5 space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <span>Reach more local and regional customers through a trusted medicine marketplace.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <span>Fast onboarding with verified account review and a familiar dashboard experience.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <span>Spend less effort on manual coordination and more on serving patients.</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-6 lg:p-8">
                <PharmacyRegisterForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
