-- Orbitex referral program foundation.
-- Rewards remain ledger records and are never added directly to withdrawable balances.

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id) on delete set null;

create unique index if not exists profiles_referral_code_unique
  on public.profiles (referral_code)
  where referral_code is not null;

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null unique references public.profiles(id) on delete cascade,
  referral_code text not null,
  status text not null default 'registered' check (status in ('registered','qualifying','rejected')),
  qualifying_deposit_amount numeric(20,8) not null default 0,
  referrer_reward_amount numeric(20,8) not null default 0,
  friend_bonus_amount numeric(20,8) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (referrer_id <> referred_user_id)
);

create table if not exists public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  claim_type text not null default 'referral' check (claim_type in ('referral','airdrop')),
  amount numeric(20,8) not null check (amount > 0),
  status text not null default 'pending_review' check (status in ('pending_review','under_review','approved','paid','rejected','cancelled')),
  notes text,
  transaction_hash text,
  reviewed_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  paid_at timestamptz
);

alter table public.referrals enable row level security;
alter table public.reward_claims enable row level security;

create policy "referrals_select_own" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_user_id);

create policy "claims_select_own" on public.reward_claims
  for select using (auth.uid() = user_id);

create policy "claims_insert_own" on public.reward_claims
  for insert with check (auth.uid() = user_id and claim_type = 'referral' and status = 'pending_review');

create trigger referrals_set_updated_at
before update on public.referrals
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  incoming_code text;
  referrer_profile_id uuid;
  generated_code text;
begin
  generated_code := upper(left(regexp_replace(coalesce(split_part(new.email, '@', 1), 'ORBITEX'), '[^a-zA-Z0-9]', '', 'g'), 8));
  if generated_code = '' then generated_code := 'ORBITEX'; end if;

  incoming_code := upper(nullif(trim(new.raw_user_meta_data->>'referral_code'), ''));
  select id into referrer_profile_id from public.profiles where referral_code = incoming_code limit 1;

  insert into public.profiles (id, full_name, referral_code, referred_by)
  values (new.id, nullif(new.raw_user_meta_data->>'full_name', ''), generated_code, referrer_profile_id)
  on conflict (id) do update set
    full_name = excluded.full_name,
    referred_by = coalesce(public.profiles.referred_by, excluded.referred_by),
    referral_code = coalesce(public.profiles.referral_code, excluded.referral_code);

  if referrer_profile_id is not null and referrer_profile_id <> new.id then
    insert into public.referrals (referrer_id, referred_user_id, referral_code)
    values (referrer_profile_id, new.id, incoming_code)
    on conflict (referred_user_id) do nothing;
  end if;

  return new;
end;
$$;
