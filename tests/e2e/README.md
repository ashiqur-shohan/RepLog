# E2E Tests — Playwright

## Quick start

```bash
# Run all E2E tests against a running dev server
pnpm test:e2e

# Run only smoke tests (no DB needed)
pnpm exec playwright test smoke

# Run in headed mode (useful for debugging)
pnpm exec playwright test --headed

# Show the last HTML report
pnpm exec playwright show-report
```

## Smoke tests (`smoke.spec.ts`)

These tests hit only public marketing pages (`/` and `/pricing`) and verify:

- Page title contains "replog"
- Key headings are visible
- CTA links are present

No Supabase or Stripe credentials are required. These run in CI on every push.

## Full critical-flow test (manual / staging)

The complete critical flow covers:

1. **Sign up** — create account via email/password at `/signup`
2. **Onboarding** — set display name and weight unit preference
3. **Create plan** — navigate to `/plans/new`, name the plan, add 2 days
4. **Add exercises** — open the exercise picker drawer, add 3 exercises per day
5. **Start workout** — tap "Start" on a plan day → workout logger opens
6. **Log sets** — enter weight, reps, and RPE for 3 sets; rest timer auto-starts
7. **Finish session** — tap "Finish workout", confirm in the dialog
8. **Verify history** — check `/history` for the new session row
9. **Verify PR** — confirm the personal record tile appears for the logged exercise

### Pre-requisites

1. A local Supabase stack running (`supabase start`)
2. `.env.local` populated with:

   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start output>
   SUPABASE_SERVICE_ROLE_KEY=<service role key>
   ```

3. Database seeded: `pnpm db:reset`
4. Dev server running: `pnpm dev` (or `CI=true pnpm test:e2e` starts it automatically)

### Running the critical flow

```bash
# Once infrastructure is up
pnpm exec playwright test critical-flow --headed --project=chromium-mobile
```

The `axe-core` accessibility assertions run as part of this flow via
`@axe-core/playwright`; install it separately if it is not in devDependencies:

```bash
pnpm add -D @axe-core/playwright
```
