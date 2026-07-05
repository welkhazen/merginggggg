-- Applied to the live rawwarapp Supabase project (iktusezbedndctnzhtwh) on 2026-07-05.
-- Aggregate member counts server-side so the admin portal doesn't page
-- through community_members (PostgREST caps unbounded selects at 1000 rows).
create or replace function public.admin_community_member_counts()
returns table (community_id text, member_count bigint)
language sql
stable
as $$
  select community_id, count(*)::bigint
  from public.community_members
  group by community_id
$$;
