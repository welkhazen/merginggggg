alter table public.token_requests
  drop constraint if exists token_requests_price_usd_check;

-- Positive range instead of a fixed package list so all wallet packages
-- (5, 10, 18, 40, 85) and any future custom amount are accepted. This matches
-- the live schema; a fixed IN (...) list would re-break custom amounts if this
-- migration were ever re-applied after the live reconcile.
alter table public.token_requests
  add constraint token_requests_price_usd_check
  check (price_usd > 0 and price_usd <= 100000);
