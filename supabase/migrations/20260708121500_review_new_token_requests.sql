create or replace function public.approve_token_request_atomic(
  p_request_id uuid,
  p_token_amount integer
)
returns table (
  id uuid,
  username text,
  credited_tokens integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request record;
begin
  if p_token_amount is null or p_token_amount <= 0 then
    raise exception 'token_amount_required' using errcode = '22023';
  end if;

  select tr.id, tr.user_id, tr.username
    into v_request
    from public.token_requests tr
    where tr.id = p_request_id
      and tr.status in ('pending', 'new')
    for update;

  if not found then
    if exists (select 1 from public.token_requests tr where tr.id = p_request_id) then
      raise exception 'token_request_already_reviewed' using errcode = 'P0001';
    end if;

    raise exception 'token_request_not_found' using errcode = 'P0002';
  end if;

  if v_request.user_id is null then
    raise exception 'token_request_missing_user' using errcode = 'P0003';
  end if;

  update public.users p
    set token_balance = coalesce(p.token_balance, 0) + p_token_amount
    where p.id = v_request.user_id;

  if not found then
    raise exception 'user_not_found' using errcode = 'P0004';
  end if;

  update public.token_requests tr
    set status = 'approved'
    where tr.id = p_request_id
    returning tr.id, tr.username, p_token_amount
    into id, username, credited_tokens;

  return next;
end;
$$;

revoke all on function public.approve_token_request_atomic(uuid, integer) from public;
revoke all on function public.approve_token_request_atomic(uuid, integer) from anon;
revoke all on function public.approve_token_request_atomic(uuid, integer) from authenticated;
grant execute on function public.approve_token_request_atomic(uuid, integer) to service_role;
