# replog

A focused SaaS workout tracker for people who train at home. Build your plan, log sets in seconds, watch your numbers climb.

**Stack:** Next.js 15 (App Router, RSC, Server Actions) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres + Auth + Storage) · Stripe · TanStack Query · Zustand · Serwist (PWA) · Sentry · Vitest + Playwright · Vercel.

---

## Project status

This is a working v1 scaffold built from a detailed architecture plan and wireframes. Everything compiles (`pnpm typecheck` clean) and unit tests pass (76 passing). Migrations, RLS policies, and seed data are ready to apply to a Supabase project.

What's wired up out of the box:

- **Auth** — email/password + Google OAuth via `@supabase/ssr`. Middleware-based session refresh and route protection.
- **Profile & onboarding** — 3-step onboarding (goal → units → experience). Profile editor with avatar upload, kg/lb toggle, danger-zone account deletion.
- **Exercise library** — browse by 8 muscle groups, filter chips, exercise detail with GIF / MP4 / WebM media support. Multi-muscle handling (primary + secondary).
- **Plan builder** — drag-and-drop exercise rows (@dnd-kit) with target sets/reps/rest, exercise picker drawer. Free-tier 1-plan quota.
- **Active workout logger** — the priority screen: 56px set rows, monospaced weight/reps, optimistic set completion, persistent rest-timer bar, Zustand-backed draft.
- **History & progress** — sessions grouped by week, recharts-based progress charts, body-measurements time series.
- **Admin** — role-gated (`auth.users.app_metadata.role = 'admin'`). Exercise CRUD with media upload to Supabase Storage, primary/secondary muscle selectors, user/equipment/muscle-group views.
- **Billing** — Stripe Checkout + Customer Portal, signature-verified webhook, entitlement mirror in `app_metadata.tier`.
- **PWA** — Serwist service worker (precache app shell, stale-while-revalidate library, cache-first Supabase images), `manifest.webmanifest`, install-ready.
- **Observability** — Sentry (client + server + edge, no-ops without DSN), structured JSON logging via `lib/log.ts`, Vercel Analytics, Upstash rate limiting on auth + write actions.

---

## Getting started

### 1. Install

```bash
pnpm install
```

### 2. Create a Supabase project

1. Create a new project at https://supabase.com.
2. Install the Supabase CLI: https://supabase.com/docs/guides/cli.
3. From this repo:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push          # applies migrations 0001..0005
supabase db seed          # loads 8 muscle groups, 15 equipment, 30 exercises
```

4. (Optional) Regenerate TypeScript types from your live schema:

```bash
pnpm dlx supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/supabase/database.types.ts
```

### 3. Make yourself an admin

In the Supabase SQL editor, run this once per email you want to grant admin to:

```sql
update auth.users
set raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', '"admin"')
where email = 'you@example.com';
```

### 4. Environment variables

Copy `.env.example` → `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` — from your Stripe dashboard (test mode).
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — optional; rate-limiting no-ops if absent.
- `NEXT_PUBLIC_SENTRY_DSN` — optional; Sentry no-ops if absent.
- `CRON_SECRET` — any strong random string; required for `/api/cron/*` endpoints.

### 5. Set up Stripe

1. Create a Product + Price for the Pro tier; copy the `price_…` ID into `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`.
2. Add a webhook endpoint pointing to `https://your-domain/api/stripe/webhook` with these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

For local development, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 6. Run the app

```bash
pnpm dev
```

Open http://localhost:3000.

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run Next.js dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | Run TypeScript compiler in `--noEmit` mode |
| `pnpm lint` | Biome lint check |
| `pnpm lint:fix` | Biome auto-fix |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright critical-flow tests |
| `pnpm db:migrate` | `supabase db push` |
| `pnpm db:reset` | `supabase db reset` |

---

## Architecture

See:
- `C:/Users/ashiqur/.claude/plans/for-this-project-there-ethereal-star.md` — the full architecture plan
- `wireframes.html` — visual reference for every screen (open in a browser)
- `supabase/migrations/` — five migration files with all schema, RLS policies, RPC functions, and triggers

Key conventions:

- **Server Actions are the default mutation path.** Route Handlers are reserved for webhooks, OAuth callback, and binary endpoints (CSV export).
- **Auth uses `@supabase/ssr` cookies** with middleware-based session refresh. Always `getUser()` (re-validates JWT), never `getSession()`.
- **RLS is the source of truth** for authorization. App-layer guards (`requireUser`, `requireAdmin`, `assertPro`) return friendly errors before the DB rejects.
- **All weights are stored in kg in the database.** Conversion to lb is applied at the application layer using `profiles.weight_unit`.
- **Soft-delete with `deleted_at` and partial unique indexes** on user-owned tables. A daily cron purges rows older than 30 days.
- **Path alias `@/*`** maps to the repo root.

---

## Folder map

```
app/
├── (marketing)/            # public landing, pricing
├── (auth)/                 # login, signup, forgot
├── auth/callback/          # OAuth PKCE
├── api/                    # webhooks, signout
└── app/                    # authenticated shell + features
    ├── dashboard, library, plans, workout, history, progress, profile, settings
    └── admin/              # role-gated exercise / user management

components/
├── ui/                     # shadcn primitives
├── domain/                 # exercise, plan, workout, progress, onboarding, admin
└── shared/                 # AppShell, Sidebar, BottomNav, EmptyState, PageHeader

lib/
├── supabase/               # server, client, middleware, admin (service-role)
├── actions/                # Server Actions per domain
├── stripe/                 # SDK singleton + entitlements
├── validators/             # zod schemas
├── stores/                 # Zustand (active workout)
├── utils/                  # cn, units, format
├── ratelimit.ts log.ts guards.ts monitor.ts

supabase/
├── migrations/             # 0001..0005 SQL
├── seed.sql                # 8 muscle groups, 15 equipment, 30 exercises
└── config.toml

tests/
├── unit/                   # Vitest
└── e2e/                    # Playwright

styles/, public/, middleware.ts, instrumentation*, next.config.ts, biome.json, vitest.config.ts, playwright.config.ts
```

---

## Production checklist

Before deploying to production:

- [ ] Generate maskable PWA icons (192, 512, 192-maskable, 512-maskable) from `public/favicon.svg`. Drop into `public/icons/`. See `public/icons/README.md`.
- [ ] Regenerate `lib/supabase/database.types.ts` from your live schema.
- [ ] Set production env vars in Vercel (everything from `.env.example`).
- [ ] Configure Stripe webhook to point to your production domain.
- [ ] Enable Vercel Cron in `vercel.json` (already wired) and confirm `CRON_SECRET` matches.
- [ ] Configure Sentry DSN for production.
- [ ] Verify `pnpm build` succeeds locally.
- [ ] Run `pnpm test:e2e` against a staging Supabase project.
