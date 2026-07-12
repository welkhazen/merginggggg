-- Community rooms are invite-only while the product routes users through the
-- synced invite_waitlist_requests table. Keep existing and future room cards
-- locked so the web app can show a Join waitlist CTA instead of entering chat.
update public.communities
set locked = true
where locked is distinct from true;

alter table public.communities
  alter column locked set default true;
