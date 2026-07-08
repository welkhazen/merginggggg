-- Mirror of the live invite_waitlist_requests table (created by the user app's
-- 20260707170000_invite_waitlist_requests.sql migration), so a fresh apply or a
-- future db push from this repo converges to the live schema instead of
-- missing the table the admin waitlist section reads. Idempotent: safe to run
-- when the table and policies already exist.
create table if not exists public.invite_waitlist_requests (
  id uuid primary key default gen_random_uuid(),
  contact text not null,
  note text not null default '',
  source text not null default 'signup_modal',
  submitted_at timestamptz not null default now(),
  status text not null default 'pending',
  constraint invite_waitlist_requests_contact_not_blank check (length(btrim(contact)) > 0),
  constraint invite_waitlist_requests_status_valid check (status in ('pending', 'contacted', 'sent_code', 'closed'))
);

create index if not exists invite_waitlist_requests_submitted_at_idx
  on public.invite_waitlist_requests (submitted_at desc);

alter table public.invite_waitlist_requests enable row level security;

drop policy if exists "Anyone can request an invite" on public.invite_waitlist_requests;
create policy "Anyone can request an invite"
  on public.invite_waitlist_requests
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can read invite waitlist requests" on public.invite_waitlist_requests;
create policy "Admins can read invite waitlist requests"
  on public.invite_waitlist_requests
  for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
        and users.status <> 'banned'
    )
  );

drop policy if exists "Admins can update invite waitlist requests" on public.invite_waitlist_requests;
create policy "Admins can update invite waitlist requests"
  on public.invite_waitlist_requests
  for update
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.role = 'admin'
        and users.status <> 'banned'
    )
  );

grant insert on public.invite_waitlist_requests to anon, authenticated;
grant select, update on public.invite_waitlist_requests to authenticated;
