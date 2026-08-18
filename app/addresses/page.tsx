import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getCurrentUser } from "@/lib/auth-server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Plus, ShieldCheck } from "lucide-react"

export default async function AddressesPage() {
  const user = await getCurrentUser()

  if (!user || user.user_type !== "customer") {
    redirect("/signin")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(248,250,252,1))]">
        <div className="container mx-auto px-4 py-8 lg:py-10">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Delivery preferences</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">Manage Addresses</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Save your preferred delivery locations to make checkout faster on the next order.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Saved addresses</CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-primary/10 p-4 text-primary">
                  <MapPin className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-foreground">No saved locations yet</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Store your most-used addresses now so your next checkout feels effortless.
                </p>
                <Button className="mt-6">
                  <Plus className="mr-2 h-4 w-4" />
                  Add address
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Why it helps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Faster checkout
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Reuse saved addresses instead of typing them again for every order.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Better delivery accuracy
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Keep landmarks and contact details ready for accurate doorstep delivery.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
