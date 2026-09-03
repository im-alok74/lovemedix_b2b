import Link from 'next/link'
import {
  ShieldCheck,
  PackageCheck,
  TrendingUp,
  FileCheck2,
  Boxes,
  ReceiptText,
  Truck,
  Store,
  ArrowRight,
  CheckCircle2,
  Clock,
  BadgeCheck,
} from 'lucide-react'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { LogoMark } from '@/components/brand/logo'

export const metadata = {
  title: 'Lovemedix — B2B Pharmaceutical Marketplace',
  description:
    'Lovemedix connects verified pharmacies with approved distributors for wholesale bulk procurement, live stock and batch data, and instant B2B invoicing.',
}

const PHARMACY_STEPS = [
  { icon: FileCheck2, title: 'Register & get verified', body: 'Sign up with your drug licence and GST. Our team verifies your documents, usually within a business day.' },
  { icon: PackageCheck, title: 'Browse the live catalog', body: 'See real stock, batch numbers, expiry and wholesale prices from every approved distributor near you.' },
  { icon: ReceiptText, title: 'Order in bulk, get an invoice', body: 'Build one cart, place a purchase order per distributor, and get a GST invoice the moment it is confirmed.' },
]

const DISTRIBUTOR_STEPS = [
  { icon: BadgeCheck, title: 'Onboard your business', body: 'Register with your wholesale licence. Once approved you get a full seller console.' },
  { icon: Boxes, title: 'List your stock', body: 'Add medicines with pricing, quantity, batch and expiry — one at a time or bulk-upload a spreadsheet.' },
  { icon: Truck, title: 'Fulfil purchase orders', body: 'Accept, process and ship orders. Stock reservation and invoicing are handled for you.' },
]

const FEATURES = [
  { icon: ShieldCheck, title: 'Verified both sides', body: 'Every pharmacy and distributor clears document verification before they can transact. No anonymous sellers.' },
  { icon: Clock, title: 'Live stock & expiry', body: 'Prices, quantities, batch numbers and expiry dates are current — not a stale price list.' },
  { icon: ReceiptText, title: 'Automatic B2B invoicing', body: 'A GST-ready invoice is generated on order confirmation, with a downloadable PDF for both parties.' },
  { icon: Boxes, title: 'Full shop management', body: 'Pharmacies run inventory, customers, retail sales and printable customer bills from the same place.' },
  { icon: TrendingUp, title: 'Fewer clicks, fewer calls', body: 'Raise a request for a new or out-of-stock medicine and route it straight to a distributor.' },
  { icon: PackageCheck, title: 'Order tracking', body: 'Every order moves through a clear lifecycle — pending, confirmed, processing, shipped, delivered.' },
]

function StepCard({ icon: Icon, title, body, n }: { icon: typeof ShieldCheck; title: string; body: string; n: number }) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6">
      <span className="absolute right-5 top-5 text-xs font-bold text-muted-foreground/50">0{n}</span>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 home-h3">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/[0.07] via-background to-background">
          <div className="page-container relative py-20 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> For licensed pharmacies & distributors only
              </span>
              <h1 className="mt-6 home-h1">
                Wholesale medicine procurement, <span className="text-primary">without the phone calls</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl home-body">
                Lovemedix is the B2B marketplace where verified pharmacies buy in bulk from approved
                distributors — with live stock, batch and expiry data, and an invoice the moment an
                order is confirmed.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/pharmacy/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Store className="h-4 w-4" /> Register your pharmacy
                </Link>
                <Link
                  href="/distributor/register"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted"
                >
                  <Truck className="h-4 w-4" /> Become a distributor
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Already onboarded? <Link href="/signin" className="font-medium text-primary hover:underline">Sign in</Link>
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ['Verified partners', 'Both sides'],
                ['Batch & expiry', 'On every listing'],
                ['GST invoicing', 'Auto-generated'],
                ['Approval', '< 1 business day'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border bg-card/60 p-4 text-center">
                  <p className="text-sm font-semibold">{k}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="page-container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="home-h2">How Lovemedix works</h2>
            <p className="mt-3 home-body">Two consoles, one marketplace. Approval-gated on both sides.</p>
          </div>

          <div id="pharmacies" className="mt-14 scroll-mt-24">
            <div className="mb-6 flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">For pharmacies</h3>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {PHARMACY_STEPS.map((s, i) => (
                <StepCard key={s.title} {...s} n={i + 1} />
              ))}
            </div>
          </div>

          <div id="distributors" className="mt-14 scroll-mt-24">
            <div className="mb-6 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">For distributors</h3>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {DISTRIBUTOR_STEPS.map((s, i) => (
                <StepCard key={s.title} {...s} n={i + 1} />
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-border bg-muted/30 py-20">
          <div className="page-container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="home-h2">Built for pharmaceutical trade</h2>
              <p className="mt-3 home-body">Everything a compliant B2B transaction needs, and nothing it doesn&apos;t.</p>
            </div>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 home-h3">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section id="compliance" className="page-container scroll-mt-24 py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="home-h2">Compliance is the default</h2>
              <p className="mt-4 home-body">
                Lovemedix is closed to consumers. Accounts are created by businesses and unlocked only
                after an admin verifies drug licences, GST registration and business documents.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Drug licence and GST verification on every account',
                  'Document review queue with per-document approval',
                  'Batch numbers and expiry captured on every order line',
                  'Full audit trail on approvals, orders and payments',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8">
              <LogoMark className="h-12 w-12" />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                &ldquo;Every party you transact with on Lovemedix has been verified against their
                pharmaceutical licences. Price, stock and expiry come straight from the seller&apos;s
                console — not a monthly rate sheet.&rdquo;
              </p>
              <p className="mt-4 text-sm font-semibold">The Lovemedix platform team</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-primary">
          <div className="page-container py-16 text-center text-primary-foreground">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to move your procurement online?</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
              Registration takes a few minutes. Verification is usually done within a business day.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/pharmacy/register"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-primary hover:bg-white/90"
              >
                Register pharmacy <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/distributor/register"
                className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Register distributor <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
