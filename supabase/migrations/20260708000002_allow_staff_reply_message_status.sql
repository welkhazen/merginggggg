-- Allow moderator-authored community replies to be labeled distinctly.
-- The admin community reply endpoint inserts community_messages.moderation_status = 'staff_reply';
-- older databases only allowed the user-facing moderation statuses and rejected those replies.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'community_messages_moderation_status_check'
  ) then
    alter table public.community_messages
      drop constraint community_messages_moderation_status_check;
  end if;

  alter table public.community_messages
    add constraint community_messages_moderation_status_check
    check (
      moderation_status is null
      or moderation_status in ('ok', 'flagged', 'review', 'removed', 'staff_reply')
    );
end $$;
