-- migration: 0005_billing
-- subscriptions, audit_log; service-role-only writes

-- ============================================================================
-- subscriptions (Stripe state mirror)
-- ============================================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  tier subscription_tier not null default 'free',
  status subscription_status not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  -- amount columns kept as decimal(10,2) for any cached pricing display
  amount_cents int check (amount_cents is null or amount_cents >= 0),
  currency text default 'usd' check (currency is null or char_length(currency) = 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create index if not exists subscriptions_customer_idx on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

-- ============================================================================
-- audit_log (append-only)
-- ============================================================================

create table if not exists public.audit_log (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action audit_action not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_user_idx on public.audit_log (user_id, created_at desc);
create index if not exists audit_log_action_idx on public.audit_log (action, created_at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity_type, entity_id);

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.subscriptions enable row level security;
alter table public.audit_log enable row level security;

-- subscriptions: owner-read only; writes only via service role (no policy => denied)
drop policy if exists subs_select on public.subscriptions;
create policy subs_select on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());

-- service role bypasses RLS by default; admin can write for support overrides
drop policy if exists subs_admin_write on public.subscriptions;
create policy subs_admin_write on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- audit_log: owner can read their own rows; only service role / admin can write
drop policy if exists audit_select on public.audit_log;
create policy audit_select on public.audit_log
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists audit_admin_write on public.audit_log;
create policy audit_admin_write on public.audit_log
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- dashboard view (joins profiles + subscriptions + session aggregates).
-- Defined here so it can reference the subscriptions table created above.
-- ============================================================================

create or replace view public.v_user_dashboard
with (security_invoker = true)
as
select
  p.id as user_id,
  p.display_name,
  p.avatar_url,
  p.weight_unit,
  coalesce(sub.tier, 'free'::subscription_tier) as tier,
  (select count(*)::int from public.workout_sessions ws
    where ws.user_id = p.id and ws.deleted_at is null and ws.finished_at is not null) as total_sessions,
  (select max(ws.started_at) from public.workout_sessions ws
    where ws.user_id = p.id and ws.deleted_at is null) as last_session_at,
  public.current_streak(p.id) as streak_days
from public.profiles p
left join public.subscriptions sub on sub.user_id = p.id
where p.deleted_at is null;
