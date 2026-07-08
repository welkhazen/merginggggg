-- Some deployments already had token_requests before 20260708000001 ran.
-- `create table if not exists` does not add newly introduced columns, so keep
-- the schema forward-compatible with custom admin grants.
alter table public.token_requests
  add column if not exists tokens int;

