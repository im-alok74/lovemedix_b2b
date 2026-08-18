import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react"

const capabilities = [
  { icon: PackageCheck, title: "Verified catalog", text: "Discover active, compliant inventory uploaded by approved distributors." },
  { icon: Truck, title: "Reliable fulfillment", text: "Place bulk orders with clear pricing, availability, tax and dispatch status." },
  { icon: FileText, title: "Medicine requests", text: "Request new or unavailable medicines and track every response in one place." },
  { icon: ClipboardCheck, title: "Trusted access", text: "Every pharmacy and distributor is reviewed before access is approved." },
]

const steps = [
  ["01", "Create your account", "Share your business details and required documents."],
  ["02", "Get verified", "Our admin team reviews your registration and approves your workspace."],
  ["03", "Start operating", "Source medicines, manage requests and keep your operations moving."],
]

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-10 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="page-container flex min-h-[64px] items-center justify-between gap-3 py-3 sm:h-[72px] sm:py-0">
          <Link href="/" className="flex items-center gap-3" aria-label="LoveMedix home">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="text-base font-bold tracking-[-0.03em] sm:text-lg">LoveMedix</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
            <Link href="/sign-in" className="whitespace-nowrap rounded-lg px-1.5 py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-4 sm:py-2.5 sm:text-sm">Sign in</Link>
            <Link href="/register" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-transform hover:-translate-y-0.5 sm:gap-2 sm:px-4 sm:text-sm">Register <ArrowRight className="hidden size-3.5 sm:block sm:size-4" aria-hidden="true" /></Link>
          </nav>
        </div>
      </header>

      <section className="relative border-b border-border/70">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,oklch(0.7_0.11_200_/_0.16),transparent_34%),linear-gradient(135deg,transparent_0%,oklch(0.7_0.11_200_/_0.04)_100%)]" />
        <div className="page-container relative grid gap-10 py-12 sm:py-20 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:gap-16 lg:py-28">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-2 text-sm font-semibold text-primary">
              <Sparkles className="size-4" aria-hidden="true" /> Built for better medicine operations
            </div>
            <h1 className="max-w-3xl text-balance text-[2.65rem] font-extrabold leading-[1.04] tracking-[-0.055em] sm:text-6xl lg:text-[72px]">Move medicine supply forward.</h1>
            <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">LoveMedix brings verified pharmacies and distributors together to source medicines, manage supply and serve communities with confidence.</p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3.5 font-semibold text-primary-foreground shadow-xl shadow-primary/20 transition-transform hover:-translate-y-0.5">Create your account <ArrowRight className="size-4" aria-hidden="true" /></Link>
              <Link href="/sign-in" className="inline-flex items-center rounded-lg border border-border bg-card px-5 py-3.5 font-semibold transition-colors hover:bg-muted">Open your workspace</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-success" aria-hidden="true" /> Admin-verified access</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-success" aria-hidden="true" /> Built for India</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-3xl" />
            <div className="relative rounded-2xl border border-border bg-card/95 p-4 shadow-2xl shadow-primary/10 sm:p-7">
              <div className="flex items-start justify-between border-b border-border pb-5">
                <div><p className="text-sm font-medium text-muted-foreground">Your operating network</p><p className="mt-1 text-2xl font-bold tracking-tight">Ready when you are</p></div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1.5 text-xs font-bold text-success"><span className="size-1.5 rounded-full bg-success" /> Live network</span>
              </div>
              <div className="grid grid-cols-2 gap-3 py-6">
                <div className="rounded-xl bg-muted/60 p-4"><BadgeCheck className="size-5 text-primary" aria-hidden="true" /><p className="mt-5 text-2xl font-bold">100%</p><p className="mt-1 text-sm text-muted-foreground">reviewed access</p></div>
                <div className="rounded-xl bg-muted/60 p-4"><Building2 className="size-5 text-primary" aria-hidden="true" /><p className="mt-5 text-2xl font-bold">One</p><p className="mt-1 text-sm text-muted-foreground">connected workspace</p></div>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="size-4" aria-hidden="true" /></span><div><p className="text-sm font-semibold">A trusted way to work</p><p className="mt-0.5 text-sm text-muted-foreground">Catalog, orders, requests and billing together.</p></div></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="page-container py-14 sm:py-24">
        <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Everything connected</p><h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.04em] sm:text-4xl">A simpler way to keep your supply moving.</h2><p className="mt-4 text-lg leading-8 text-muted-foreground">From your first medicine search to final dispatch, LoveMedix gives your team a clear, dependable workflow.</p></div>
        <div className="mt-8 grid gap-3 sm:mt-12 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">{capabilities.map(({ icon: Icon, title, text }) => <article key={title} className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="size-5" aria-hidden="true" /></span><h3 className="mt-7 text-lg font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div>
      </section>

      <section id="steps" className="border-y border-border bg-muted/30"><div className="page-container grid gap-8 py-14 sm:py-20 lg:grid-cols-[.7fr_1.3fr] lg:items-center"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Start with confidence</p><h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Your next step is simple.</h2></div><div className="grid gap-4 md:grid-cols-3">{steps.map(([number, title, text]) => <div key={number} className="rounded-2xl border border-border bg-card p-5"><p className="font-mono text-sm font-bold text-primary">{number}</p><h3 className="mt-8 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></div></section>

      <section className="bg-primary text-primary-foreground"><div className="page-container flex flex-col gap-6 py-10 sm:gap-7 sm:py-14 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Make every medicine movement count.</h2><p className="mt-2 max-w-xl leading-7 text-primary-foreground/75">Join LoveMedix and give your pharmacy or distribution team a better way to operate.</p></div><Link href="/register" className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-primary-foreground px-5 py-3.5 font-bold text-primary transition-transform hover:-translate-y-0.5">Get started <ArrowRight className="size-4" aria-hidden="true" /></Link></div></section>

      <footer className="border-t border-border bg-card" aria-label="LoveMedix footer">
        <div className="page-container grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.3fr_0.7fr_0.9fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="LoveMedix home">
              <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="size-5" aria-hidden="true" /></span>
              <span className="text-lg font-bold tracking-[-0.03em]">LoveMedix</span>
            </Link>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">A trusted operating network for verified pharmacies and medicine distributors.</p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              <span className="rounded-full border border-border px-3 py-1.5">Verified access</span>
              <span className="rounded-full border border-border px-3 py-1.5">Built for India</span>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold">Platform</h2>
            <nav className="mt-4 grid gap-3 text-sm text-muted-foreground" aria-label="Platform links">
              <Link href="/register/pharmacy" className="transition-colors hover:text-foreground">For pharmacies</Link>
              <Link href="/register/distributor" className="transition-colors hover:text-foreground">For distributors</Link>
              <Link href="/sign-in" className="transition-colors hover:text-foreground">Sign in</Link>
            </nav>
          </div>
          <div>
            <h2 className="text-sm font-bold">How it works</h2>
            <nav className="mt-4 grid gap-3 text-sm text-muted-foreground" aria-label="Company links">
              <a href="#capabilities" className="transition-colors hover:text-foreground">Capabilities</a>
              <a href="#steps" className="transition-colors hover:text-foreground">Getting started</a>
              <Link href="/register" className="transition-colors hover:text-foreground">Create an account</Link>
            </nav>
          </div>
          <div>
            <h2 className="text-sm font-bold">Contact LoveMedix</h2>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <a href="mailto:support@lovemedix.in" className="flex items-start gap-2.5 transition-colors hover:text-foreground"><Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>support@lovemedix.in</span></a>
              <a href="tel:+919508178521" className="flex items-start gap-2.5 transition-colors hover:text-foreground"><Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>+91 95081 78521</span></a>
              <p className="flex items-start gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>Silao, Nalanda, Bihar, India</span></p>
            </div>
          </div>
        </div>
        <div className="border-t border-border"><div className="page-container flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} LoveMedix Healthcare Private Limited.</p><p>Medicine operations, made clearer.</p></div></div>
      </footer>
    </main>
  )
}
