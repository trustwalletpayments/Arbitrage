-- ORBITEX referral deposit reward processing.
-- This migration only creates a trusted server-side settlement function.
-- It does not move funds into user balances and does not touch the airdrop program.

create table if not exists public.referral_deposit_events (
  id uuid primary key default gen_random_uuid(),
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  deposit_reference text not null unique,
  asset text not null default 'USDT',
  deposit_amount numeric(38,18) not null check (deposit_amount > 0),
  referrer_reward_amount numeric(38,18) not null default 0,
  friend_bonus_amount numeric(38,18) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.referral_deposit_events enable row level security;

drop policy if exists referral_deposit_events_select_own on public.referral_deposit_events;
create policy referral_deposit_events_select_own
  on public.referral_deposit_events
  for select
  using (auth.uid() = referred_user_id);

-- Only trusted backend code should be able to settle a confirmed deposit.
revoke all on public.referral_deposit_events from anon, authenticated;
grant select on public.referral_deposit_events to authenticated;

create or replace function public.process_referral_deposit(
  p_referred_user_id uuid,
  p_deposit_reference text,
  p_deposit_amount numeric,
  p_asset text default 'USDT'
)
returns table (
  processed boolean,
  referral_id uuid,
  referrer_reward numeric,
  friend_bonus numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  referral_row public.referrals%rowtype;
  referrer_amount numeric(38,18);
  friend_amount numeric(38,18);
  inserted_event public.referral_deposit_events%rowtype;
begin
  if p_referred_user_id is null
     or nullif(trim(p_deposit_reference), '') is null
     or p_deposit_amount is null
     or p_deposit_amount <= 0 then
    raise exception 'Invalid referral deposit data';
  end if;

  -- A deposit reference is the idempotency key. Replays never create rewards twice.
  select *
    into referral_row
    from public.referrals
   where referred_user_id = p_referred_user_id
   for update;

  if not found then
    return query select false, null::uuid, 0::numeric, 0::numeric;
    return;
  end if;

  if referral_row.status = 'rejected' then
    return query select false, referral_row.id, 0::numeric, 0::numeric;
    return;
  end if;

  if exists (
    select 1
      from public.referral_deposit_events
     where deposit_reference = trim(p_deposit_reference)
  ) then
    return query select false, referral_row.id, 0::numeric, 0::numeric;
    return;
  end if;

  referrer_amount := round(p_deposit_amount * 0.15, 8);
  friend_amount := round(p_deposit_amount * 0.20, 8);

  insert into public.referral_deposit_events (
    referred_user_id,
    deposit_reference,
    asset,
    deposit_amount,
    referrer_reward_amount,
    friend_bonus_amount
  )
  values (
    p_referred_user_id,
    trim(p_deposit_reference),
    upper(coalesce(nullif(trim(p_asset), ''), 'USDT')),
    p_deposit_amount,
    referrer_amount,
    friend_amount
  )
  returning * into inserted_event;

  update public.referrals
     set status = 'qualifying',
         qualifying_deposit_amount = qualifying_deposit_amount + inserted_event.deposit_amount,
         referrer_reward_amount = referrer_reward_amount + inserted_event.referrer_reward_amount,
         friend_bonus_amount = friend_bonus_amount + inserted_event.friend_bonus_amount,
         updated_at = now()
   where id = referral_row.id;

  return query
  select true,
         referral_row.id,
         inserted_event.referrer_reward_amount,
         inserted_event.friend_bonus_amount;
end;
$$;

revoke all on function public.process_referral_deposit(uuid, text, numeric, text) from public, anon, authenticated;
grant execute on function public.process_referral_deposit(uuid, text, numeric, text) to service_role;
