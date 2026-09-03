# Lovemedix → B2B marketplace rebuild

Branch: `rebuild/b2b-marketplace`. Tracking doc for the staged rewrite.

## Target

Production-grade **B2B pharmaceutical marketplace**. Roles: **Admin, Pharmacy,
Distributor**. No consumer accounts, no consumer ordering. Public site is a B2B
landing page with login/register.

- Pharmacies & distributors register with business/legal documents; dashboards
  unlock only after **Admin approval**.
- Distributors upload/manage medicines: pricing, stock, batch, expiry.
- Approved pharmacies browse the catalog and **purchase in bulk**.
- Pharmacies raise requests for **new / out-of-stock medicines**, manage shop
  data, customers, inventory, purchases/sales, and generate customer bills.
- Full **Admin panel**: approvals, document verification, medicines, orders,
  requests, pharmacies, distributors, platform settings.

## Audit summary (what we started from)

Half-migrated codebase: a B2B Prisma schema existed but was never applied
(no migrations); the live DB was hand-built via raw SQL scripts. Most B2B API
routes ran on **raw `@neondatabase/serverless` SQL against the old schema**, not
Prisma. A full consumer storefront (cart, checkout, wishlist, PDP buy flow,
doctors, health content, prescription upload, public catalog) was still wired in
alongside, plus large hardcoded mock-data libs and a 1mg scraper.

## Phases

- [x] **Phase 1 — Database & schema.** New Neon project `lovemedix-b2b`
  (`jolly-truth-38608837`). Clean consolidated `prisma/schema.prisma`, initial
  migration applied, idempotent seed (admin + categories + platform settings).
- [x] **Phase 2 — Remove consumer surface.** Deleted all consumer pages/routes/
  components, mock-data libs, scraper & debug scripts. Rebranded to Lovemedix.
  Rewrote the public shell (layout, header, footer, sitemap, manifest) as B2B.
- [ ] **Phase 3 — Auth & middleware.** Consolidate `lib/auth*.ts` +
  `lib/seller-auth.ts` into one Prisma-based module. Route-group middleware
  enforcing role + approval gating. Remove `lib/db.ts` (raw SQL).
- [ ] **Phase 4 — Admin panel.** Approvals, document verification, medicines,
  distributors, pharmacies, purchase orders, medicine requests, settings, users.
- [ ] **Phase 5 — Distributor.** Registration + docs, listing management
  (price/stock/batch/expiry), bulk upload, incoming purchase orders, requests.
- [ ] **Phase 6 — Pharmacy.** Registration + docs, catalog browse, bulk cart →
  purchase order, medicine requests, inventory, customers, retail sales/billing.
- [ ] **Phase 7 — Landing & polish.** Landing page, empty/loading/error states,
  a11y, rate limiting, audit logging, notifications, invoice PDF, seed data,
  end-to-end verification.

## Local setup

`.env.local` holds `DATABASE_URL` (pooled) + `DIRECT_URL` (unpooled) for the new
Neon DB. `npm run db:seed` seeds admin `admin@lovemedix.in` (password from
`SEED_ADMIN_PASSWORD`, default `ChangeMe#2026` — change immediately).
