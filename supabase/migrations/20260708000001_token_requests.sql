-- Token top-up requests. A user who is out of tokens submits a request for a
-- wallet package in the user app (welkhazen/wzwznew); an admin reviews it in the
-- Commerce tab here and sets status = 'approved', which credits the user's
-- balance via the trigger below.
--
-- Column shape matches the admin commerce route
-- (server/routes/admin/commerce.ts): id, user_id, username, price_usd,
-- reasons[], note, status, created_at. `tokens` records how many tokens to grant
-- on approval.

create table if not exists public.token_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  username text,
  tokens int,
  price_usd numeric(10,2),
  reasons text[] not null default '{}',
  note text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint token_requests_status_valid check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists token_requests_status_idx
  on public.token_requests (status, created_at desc);
create index if not exists token_requests_user_idx
  on public.token_requests (user_id, created_at desc);

alter table public.token_requests enable row level security;

-- Users (anon session) can submit a request.
create policy "Users can request tokens"
  on public.token_requests
  for insert
  to anon, authenticated
  with check (true);

-- Direct authenticated admin access (the admin dashboard's server route uses the
-- service role and bypasses RLS, so these are just a safety net).
create policy "Admins can read token requests"
  on public.token_requests
  for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin' and users.status <> 'banned'
    )
  );

create policy "Admins can update token requests"
  on public.token_requests
  for update
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin' and users.status <> 'banned'
    )
  );

grant insert on public.token_requests to anon, authenticated;
grant select, update on public.token_requests to authenticated;

-- When a request flips to 'approved', credit the requested tokens to the user's
-- balance exactly once. The admin route only PATCHes status, so this trigger is
-- what actually grants the tokens.
create or replace function public.grant_tokens_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved'
     and old.status is distinct from 'approved'
     and new.tokens is not null and new.tokens > 0
     and new.user_id is not null then
    update public.users
      set token_balance = token_balance + new.tokens
      where id = new.user_id;
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists token_requests_grant_on_approval on public.token_requests;
create trigger token_requests_grant_on_approval
  before update on public.token_requests
  for each row execute function public.grant_tokens_on_approval();
