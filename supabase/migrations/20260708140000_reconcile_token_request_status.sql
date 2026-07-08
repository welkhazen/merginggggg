-- Reconcile the token_requests status constraint with what the admin code and
-- the approval RPC actually write.
--
-- The base migration (20260708000001) created
--   constraint token_requests_status_valid check (status in ('pending','approved','rejected'))
-- but approve_token_request_atomic (20260708121500) sets status = 'fulfilled',
-- and the commerce route also uses 'new' (default awaiting-review state). Older
-- live deployments instead carried a token_requests_status_check limited to
-- ('new','rejected','fulfilled'), which rejected the 'pending' bump the approve
-- flow performs -> admin "Could not update token request".
--
-- Normalise to the full set the code writes, dropping whichever legacy
-- constraint name a given deployment happens to have. Idempotent, and matches
-- the live schema so re-applying here or there converges to the same result.

alter table public.token_requests
  drop constraint if exists token_requests_status_valid;

alter table public.token_requests
  drop constraint if exists token_requests_status_check;

alter table public.token_requests
  add constraint token_requests_status_check
  check (status in ('new', 'pending', 'approved', 'rejected', 'fulfilled'));
