-- Applied to the live rawwarapp Supabase project (iktusezbedndctnzhtwh) on 2026-07-05.
-- Pin search_path so the function passes Supabase security advisors.
create or replace function public.admin_community_member_counts()
returns table (community_id text, member_count bigint)
language sql
stable
set search_path = ''
as $$
  select community_id, count(*)::bigint
  from public.community_members
  group by community_id
$$;
