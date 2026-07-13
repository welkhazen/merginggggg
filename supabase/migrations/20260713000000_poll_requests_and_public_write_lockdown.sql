-- Poll requests + public-write lockdown.
--
-- Rule (source of truth = Supabase): the public can NOT post polls directly.
-- They submit a request; a staff member reviews it in the admin portal
-- (welkhazen/merginggggg) and approval spawns the real poll. This mirrors the
-- existing community_requests -> communities flow (server/routes/admin/requests.ts).
--
-- It also drops a set of always-true write policies flagged by the Supabase
-- security advisor. Each dropped policy was verified to have ZERO direct
-- browser writes in either app (welkhazen/wzwznew and this repo) -- every
-- legitimate mutation on these tables already goes through the service-role
-- server (/api/*), which bypasses RLS. So removing the anon holes closes the
-- tamper vector without breaking any live flow.
--
-- NOT touched here (they ARE load-bearing browser writes and need their ops
-- moved server-side first): user_aliases, avatar_catalog. Tracked as follow-up.

-- 1. poll_requests -----------------------------------------------------------
-- Shape mirrors community_requests: uuid id, text requester fields, pending by
-- default, reviewed_by/at stamped by the admin route on approve/reject.
create table if not exists public.poll_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id text,
  requester_name text,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  note text default '',
  submitted_at timestamptz not null default now(),
  status text not null default 'pending',
  reviewed_at timestamptz,
  reviewed_by text,
  constraint poll_requests_status_valid check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists poll_requests_status_idx
  on public.poll_requests (status, submitted_at desc);

alter table public.poll_requests enable row level security;

-- The public may only submit a *pending* request (can't self-approve, and
-- can't spoof the reviewer fields the admin route stamps on approval).
drop policy if exists "Anyone can request a poll" on public.poll_requests;
create policy "Anyone can request a poll"
  on public.poll_requests
  for insert
  to anon, authenticated
  with check (status = 'pending' and reviewed_at is null and reviewed_by is null);

-- Safety net for a truly authenticated admin session (the portal itself uses
-- the service role and bypasses RLS, so these only matter for direct API use).
drop policy if exists "Admins can read poll requests" on public.poll_requests;
create policy "Admins can read poll requests"
  on public.poll_requests
  for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin' and users.status <> 'banned'
    )
  );

drop policy if exists "Admins can update poll requests" on public.poll_requests;
create policy "Admins can update poll requests"
  on public.poll_requests
  for update
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin' and users.status <> 'banned'
    )
  );

grant insert on public.poll_requests to anon, authenticated;
grant select, update on public.poll_requests to authenticated;

-- 2. Lock down direct public poll creation -----------------------------------
-- Polls (and their options) are now created only by staff via the approval
-- route (service role). The browser paths that used these policies are dead
-- code in wzwznew (src/lib/api/polls.ts createAdminPoll/deleteAdminPoll have no
-- callers; the live admin poll store is localStorage).
drop policy if exists "Public insert" on public.polls;
drop policy if exists "Public delete" on public.polls;
drop policy if exists "public_insert" on public.poll_options;
drop policy if exists "public_delete" on public.poll_options;

-- 3. Drop redundant always-true UPDATE/DELETE holes --------------------------
-- (0 direct browser writes; legitimate mutations run through /api/*.)
drop policy if exists "anon_delete" on public.community_members;
drop policy if exists "anon_delete" on public.community_polls;
drop policy if exists "anon_delete" on public.community_poll_options;
drop policy if exists "anon_update" on public.community_poll_votes;
drop policy if exists "chat_reports_update" on public.chat_reports;
drop policy if exists "issue_reports_update" on public.issue_reports;
drop policy if exists "notification_consents_update_all" on public.notification_consents;
