alter table public.token_requests
  drop constraint if exists token_requests_price_usd_check;

alter table public.token_requests
  add constraint token_requests_price_usd_check
  check (price_usd in (5, 10, 18, 40, 85));
