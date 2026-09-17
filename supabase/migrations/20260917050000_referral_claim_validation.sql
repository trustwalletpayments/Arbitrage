-- ORBITEX referral claim validation.
-- Claims remain manual-review requests and never transfer funds automatically.
-- This migration does not touch the airdrop program.

alter table public.reward_claims
  add column if not exists claim_source text not null default 'referral_reward'
  check (claim_source in ('referral_reward', 'friend_bonus'));

create or replace function public.validate_referral_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  available_amount numeric := 0;
  already_claimed numeric := 0;
  qualifying_count integer := 0;
  task_count integer := 0;
begin
  if new.claim_type <> 'referral' then
    return new;
  end if;

  if new.status <> 'pending_review' then
    raise exception 'Referral claims must start in pending_review status';
  end if;

  if new.amount <= 0 then
    raise exception 'Claim amount must be positive';
  end if;

  if new.claim_source = 'friend_bonus' then
    select coalesce(sum(friend_bonus_amount), 0)
      into available_amount
      from public.referrals
     where referred_user_id = new.user_id;

    select count(*)
      into task_count
      from public.referral_task_completions
     where user_id = new.user_id;

    if task_count < 3 then
      raise exception 'Friend bonus requires at least 3 completed tasks';
    end if;
  else
    select count(*)
      into qualifying_count
      from public.referrals
     where referrer_id = new.user_id
       and status = 'qualifying';

    if qualifying_count < 5 then
      raise exception 'Referral rewards require at least 5 qualifying referrals';
    end if;

    select coalesce(sum(referrer_reward_amount), 0)
      into available_amount
      from public.referrals
     where referrer_id = new.user_id
       and status = 'qualifying';
  end if;

  select coalesce(sum(amount), 0)
    into already_claimed
    from public.reward_claims
   where user_id = new.user_id
     and claim_type = 'referral'
     and claim_source = new.claim_source
     and status in ('pending_review', 'under_review', 'approved', 'paid');

  if new.amount > greatest(available_amount - already_claimed, 0) then
    raise exception 'Claim amount exceeds the eligible referral balance';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_referral_claim() from public, anon, authenticated;

drop trigger if exists reward_claims_validate_referral_trigger on public.reward_claims;
create trigger reward_claims_validate_referral_trigger
before insert on public.reward_claims
for each row
execute function public.validate_referral_claim();
