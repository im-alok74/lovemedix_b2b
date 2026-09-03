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
- [x] **Phase 3 — Auth & middleware.** One Prisma auth module (`lib/auth.ts`):
  role + approval guards, request-cached context. Edge-safe `proxy.ts` cookie
  gate; deep role/approval checks in route-group layouts. Deleted `lib/db.ts`,
  `lib/seller-auth.ts`, `lib/auth-edge.ts`.
- [x] **Phase 4 — Admin panel.** Overview, pharmacy/distributor approval +
  document verification, medicine catalog CRUD, categories, purchase orders,
  medicine requests, users, platform settings. Audit log + notifications.
- [x] **Phase 5 — Distributor.** Register + document upload, listing CRUD + bulk
  spreadsheet upload, incoming purchase-order state machine (auto-invoice on
  confirm, stock reservation/consumption), medicine-request resolution, settings.
- [x] **Phase 6 — Pharmacy.** Register + documents, catalog browse, per-browser
  cart → one purchase order per distributor, PO tracking + pay, medicine
  requests, inventory, customers, retail billing (printable bill, stock decrement).
- [x] **Phase 7 — Polish & verification.** B2B landing shell, register forms
  matched to schema, `proxy.ts` convention, transaction timeouts tuned for Neon,
  demo seed (`prisma/seed-demo.mjs`). Full `next build` green; end-to-end flow
  verified against the live dev server (place PO → confirm → invoice → ship →
  pay; add inventory → customer bill).

- [x] **Phase 8 — Follow-ups.** Direct file upload (`/api/uploads`, Cloudinary
  when `CLOUDINARY_*` set, graceful 501 + paste-a-link fallback). Client-side
  invoice/bill PDF download (`html2pdf.js`). In-app notifications API + header
  bell with unread badge and mark-all-read.

### Still open

- Set `CLOUDINARY_*` in the environment to turn on direct document upload.
- Email/SMS delivery of notifications (in-app `Notification` rows only today).
- The `origin/main` divergence (LoveMedix rebrand + portal-shell) is still
  unmerged; this branch was built on the local working tree per the audit.

## Local setup

`.env.local` holds `DATABASE_URL` (pooled) + `DIRECT_URL` (unpooled) for the new
Neon DB. `npm run db:seed` seeds admin `admin@lovemedix.in` (password from
`SEED_ADMIN_PASSWORD`, default `ChangeMe#2026` — change immediately).
