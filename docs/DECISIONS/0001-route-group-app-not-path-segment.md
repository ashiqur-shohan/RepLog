# 0001 — Use route group `(app)` instead of path segment `/app`

**Status**: accepted (2026-05-18)

## Context

The initial scaffold nested authenticated routes under `app/app/` so that the production URLs were `/app/dashboard`, `/app/library`, etc. Middleware used `pathname.startsWith("/app")` to gate access.

## Decision

Use `app/(app)/` (a Next.js route group) so URLs become `/dashboard`, `/library`, etc. Move authorization from middleware path-matching into route-group layouts:

- `(app)/layout.tsx` → calls `requireUser()` (redirects to `/login` if absent).
- `(app)/admin/layout.tsx` → calls `requireAdmin()` (404s non-admins — no leak that the route exists).
- `(auth)/layout.tsx` → redirects authenticated users to `/dashboard`.

Middleware now only refreshes the Supabase auth cookie.

## Consequences

- Cleaner URLs that match user expectations (Linear, Notion, Cal.com all do this).
- Layouts own their own authorization — easier to reason about than path regex in middleware.
- Renaming or moving routes doesn't require touching middleware.
- Trade-off: slightly more boilerplate in each layout, but the same guard helpers (`requireUser`, `requireAdmin`) are used.
