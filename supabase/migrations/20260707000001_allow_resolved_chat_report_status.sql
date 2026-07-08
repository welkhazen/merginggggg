-- The admin portal resolves a chat report by setting status = 'resolved'
-- (server/routes/admin/reports.ts), but the chat_reports CHECK constraint only
-- permitted open/dismissed/warned/banned. Every "Resolve" click therefore hit a
-- constraint violation that surfaced in the UI as "Could not update report",
-- while "Dismiss" (status = 'dismissed') worked because it was allowed.
--
-- Add 'resolved' to the allowed set. Existing values are preserved.
alter table public.chat_reports drop constraint if exists chat_reports_status_check;
alter table public.chat_reports add constraint chat_reports_status_check
  check (status = any (array['open', 'resolved', 'dismissed', 'warned', 'banned']));
