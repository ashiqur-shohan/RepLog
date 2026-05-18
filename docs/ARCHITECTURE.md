# Architecture

This document is the source of truth for replog's high-level architecture. For visual references see [`wireframes.html`](./wireframes.html); for the full planning artifact see the original plan at `C:/Users/ashiqur/.claude/plans/for-this-project-there-ethereal-star.md`.

## Stack

- **Next.js 15** App Router (RSC + Server Actions) on Vercel
- **TypeScript** strict mode, `noUncheckedIndexedAccess`
- **Tailwind CSS v4** with CSS-first `@theme` tokens
- **shadcn/ui** (Radix primitives) for component primitives
- **Supabase** for Postgres + Auth + Storage + Realtime
- **Stripe** for billing
- **TanStack Query** for client cache, **Zustand** for ephemeral UI state (active workout)
- **react-hook-form + zod** for forms
- **Serwist** for the installable PWA
- **Sentry** + **Vercel Analytics** for observability
- **Vitest** for unit tests, **Playwright** for E2E
- **Biome** for lint + format

## Routing layout

```
app/
├── (marketing)/         public: landing, pricing, blog
├── (auth)/              public: login, signup, forgot
├── auth/callback/       OAuth PKCE return (Route Handler)
├── api/                 webhooks, signout, cron
└── (app)/               authenticated app shell — gated by AppShell
    ├── dashboard/
    ├── library/
    ├── plans/
    ├── workout/         active session logger (focus mode)
    ├── history/
    ├── progress/
    ├── profile/
    ├── settings/        + /settings/billing, /settings/notifications
    └── admin/           role-gated; 404s for non-admins
```

Authorization is enforced inside route-group layouts, not in middleware:
- `(app)/layout.tsx` calls `requireUser()` → redirects to `/login`.
- `(app)/admin/layout.tsx` calls `requireAdmin()` → returns 404 to non-admins.
- `(auth)/layout.tsx` redirects authenticated users to `/dashboard`.

Middleware only refreshes the Supabase auth cookie.

## Data layer

- **Postgres schema** lives in `supabase/migrations/0001..0006`.
- **RLS is the source of truth** for row ownership. App-layer guards add friendly error messages and quota / tier checks.
- **All weights stored in kg** at the database level. Conversion to lb happens at the application boundary using `profiles.weight_unit` and `lib/utils/units.ts`.
- **Soft delete** via `deleted_at` columns + partial unique indexes. A daily cron at `/api/cron/purge-soft-deleted` hard-deletes rows older than 30 days.
- **Multi-muscle exercises** via the `exercise_muscles` M:N table with a `muscle_role` enum (`primary` | `secondary`).

## Tier strategy

- **Free**: 1 active workout plan, unlimited sessions, full library, basic charts.
- **Pro**: unlimited plans, custom exercises, progress photos, CSV export, advanced charts.

Stripe webhook (`/api/stripe/webhook`) mirrors subscription state into the `subscriptions` table and writes `tier` into `auth.users.app_metadata` for fast checks.

## Folder map

```
app/                     route tree (see above)
components/
├── ui/                  shadcn primitives
├── domain/<feature>/    feature components (exercise, plan, workout, …)
└── shared/              AppShell, Sidebar, BottomNav, EmptyState
lib/
├── supabase/            server/client/middleware/admin clients
├── actions/             Server Actions, one file per domain
├── validators/          zod schemas
├── stores/              Zustand (active workout)
├── stripe/              Stripe SDK singleton + entitlements
└── {log,ratelimit,guards,monitor,utils}.ts
hooks/                   shared React hooks
types/                   cross-feature TypeScript types
supabase/migrations/     SQL migrations 0001..0006
supabase/seed.sql        muscle groups, equipment, starter exercises
tests/{unit,e2e}/        Vitest + Playwright
docs/                    architecture + wireframes
.github/                 CI workflows + templates
```

## Key conventions

- **Server Components are the default**; `"use client"` only where state, effects, or browser APIs require it.
- **Server Actions return `ActionResult<T>`** from `lib/actions/types.ts` — a discriminated union the call site can narrow.
- **Forms use the action prop + `useTransition`** rather than imperative submission.
- **Mutations call `revalidatePath` or `revalidateTag`** to refresh server-rendered data.
- **Path alias `@/*`** maps to the repo root.
- **No `src/` directory** — matches the Vercel Commerce convention.
- **Tailwind v4 CSS-first config** in `app/globals.css` via `@theme`. No `tailwind.config.ts`.

## Observability

- **Sentry**: client + server + edge SDKs. No-ops gracefully without DSN.
- **Structured logs** via `lib/log.ts` — JSON per line for Vercel ingest.
- **Vercel Analytics + Speed Insights** wired at the root layout.
- **Upstash Ratelimit** on auth + write Server Actions (no-ops without Redis credentials).

## PWA

- **Serwist** service worker (`app/sw.ts`):
  - precaches the app shell
  - stale-while-revalidate for `/library/*` (24h)
  - cache-first for Supabase Storage images (7d)
  - network-only for all `POST` mutations
- **Manifest** at `public/manifest.webmanifest` — installable, standalone, portrait-primary.
- **No offline mutation queue in v1** — failed `logSet` calls surface a retry toast.

## Build sequence

See [`README.md`](../README.md) for the step-by-step setup and the build milestone log.
