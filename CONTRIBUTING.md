# Contributing to replog

Welcome — quick orientation so you can land your first change.

## Setup

See [`README.md`](./README.md) — it has the full A-to-Z for cloning, linking Supabase, applying migrations, and starting the dev server.

## Running locally

```bash
pnpm dev          # Next.js dev server (Turbopack)
pnpm typecheck    # tsc --noEmit
pnpm lint         # Biome
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright (requires running app)
pnpm build        # production build
```

All four (`typecheck`, `lint`, `test`, `build`) must pass before merge — CI enforces this.

## Folder map

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Working with the database

Migrations live in [`supabase/migrations/`](./supabase/migrations/) — never edit an applied file; always add a new one (`NNNN_what_changed.sql`).

```bash
supabase db push          # apply pending migrations to your linked project
supabase db reset         # local dev only — wipes and re-applies everything
```

Seed data is in [`supabase/seed.sql`](./supabase/seed.sql). For remote projects, run it manually via the Supabase SQL Editor (not via `db push`).

After applying migrations to a fresh project, regenerate types:

```bash
pnpm dlx supabase gen types typescript --project-id <YOUR-REF> > lib/supabase/database.types.ts
```

## Bootstrapping an admin

In Supabase → SQL Editor:

```sql
update auth.users
set raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', '"admin"')
where email = 'you@example.com';
```

## Style

- TypeScript strict mode; no `any` unless commented why.
- Server Components by default; `"use client"` only when needed.
- Forms: `react-hook-form` + `zod` with shared schemas in [`lib/validators/`](./lib/validators/).
- Server Actions return `ActionResult<T>` from [`lib/actions/types.ts`](./lib/actions/types.ts).
- Tailwind v4 CSS-first via `@theme` in [`app/globals.css`](./app/globals.css). Use the semantic tokens (`bg-primary`, `text-muted-foreground`, …), not raw hex.
- Lucide icons, stroke 1.75, sizes 16/20/24.

## Commit / PR

- Small, single-purpose commits.
- One PR = one logical change.
- Use the [PR template](./.github/pull_request_template.md).
- Mention any architectural decision in [`docs/DECISIONS/`](./docs/DECISIONS/) as a numbered ADR.

## Questions

Open an issue with the `question` label.
