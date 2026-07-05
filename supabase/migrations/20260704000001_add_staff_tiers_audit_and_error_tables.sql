-- Applied to the live rawwarapp Supabase project (iktusezbedndctnzhtwh) on 2026-07-04.
-- Kept here for reference / reproducibility.

-- Portal staff tiers: kept in a separate column so users.role stays
-- compatible with the main myraw.app admin checks (admin|moderator).
alter table public.users
  add column if not exists staff_tier text
  check (staff_tier in ('moderator','admin','owner','super_admin'));

update public.users set staff_tier = 'super_admin' where role = 'admin' and staff_tier is null;
update public.users set staff_tier = 'moderator' where role = 'moderator' and staff_tier is null;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  actor_username text,
  actor_tier text,
  action text not null,
  target_type text,
  target_id text,
  target_label text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_actor_idx on public.admin_audit_log (actor_id);
create index if not exists admin_audit_log_action_idx on public.admin_audit_log (action);
alter table public.admin_audit_log enable row level security;

create table if not exists public.error_events (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'client' check (source in ('client','server','supabase','vercel','external')),
  level text not null default 'error' check (level in ('info','warning','error','fatal')),
  message text not null,
  stack text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved boolean not null default false,
  resolved_by text,
  resolved_at timestamptz
);
create index if not exists error_events_created_at_idx on public.error_events (created_at desc);
create index if not exists error_events_resolved_open_idx on public.error_events (resolved) where resolved = false;
alter table public.error_events enable row level security;
