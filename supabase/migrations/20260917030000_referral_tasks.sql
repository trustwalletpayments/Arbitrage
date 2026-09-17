-- ORBITEX referral task tracking.
-- Task completion is recorded separately from deposits and rewards.
-- Only trusted backend code may mark a task complete.

create table if not exists public.referral_task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  unique (user_id, task_key)
);

alter table public.referral_task_completions enable row level security;

drop policy if exists referral_task_completions_select_own on public.referral_task_completions;
create policy referral_task_completions_select_own
  on public.referral_task_completions
  for select
  using (auth.uid() = user_id);

revoke all on public.referral_task_completions from anon, authenticated;
grant select on public.referral_task_completions to authenticated;

create or replace function public.complete_referral_task(
  p_user_id uuid,
  p_task_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  inserted boolean,
  completed_tasks integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  was_inserted boolean := false;
  task_count integer;
begin
  if p_user_id is null or nullif(trim(p_task_key), '') is null then
    raise exception 'Invalid referral task data';
  end if;

  insert into public.referral_task_completions (user_id, task_key, metadata)
  values (p_user_id, trim(p_task_key), coalesce(p_metadata, '{}'::jsonb))
  on conflict (user_id, task_key) do nothing;

  get diagnostics was_inserted = row_count;

  select count(*)::integer
    into task_count
    from public.referral_task_completions
   where user_id = p_user_id;

  return query select was_inserted, task_count;
end;
$$;

revoke all on function public.complete_referral_task(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.complete_referral_task(uuid, text, jsonb) to service_role;
