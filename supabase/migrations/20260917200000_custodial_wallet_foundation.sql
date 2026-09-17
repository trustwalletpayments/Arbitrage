-- Orbitex custodial wallet foundation.
-- This migration creates accounting records only. It does not store private keys
-- or automatically move blockchain funds.

create extension if not exists pgcrypto;

create table if not exists public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  asset text not null default 'USDT',
  network text not null default 'BEP20',
  deposit_address text,
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (asset, network, deposit_address)
);

create table if not exists public.wallet_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  wallet_account_id uuid not null references public.wallet_accounts(id) on delete restrict,
  asset text not null default 'USDT',
  network text not null default 'BEP20',
  tx_hash text not null,
  from_address text,
  to_address text,
  amount numeric(38,18) not null check (amount > 0),
  confirmations integer not null default 0 check (confirmations >= 0),
  status text not null default 'detected' check (status in ('detected','confirming','credited','rejected')),
  credited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (network, tx_hash, asset)
);

create table if not exists public.wallet_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  asset text not null default 'USDT',
  network text not null default 'BEP20',
  destination_address text not null,
  amount numeric(38,18) not null check (amount > 0),
  fee numeric(38,18) not null default 0 check (fee >= 0),
  status text not null default 'pending' check (status in ('pending','approved','processing','completed','rejected','failed')),
  tx_hash text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  asset text not null default 'USDT',
  entry_type text not null check (entry_type in ('deposit','withdrawal_hold','withdrawal_release','withdrawal_complete','trade_credit','trade_debit','adjustment')),
  amount numeric(38,18) not null check (amount <> 0),
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists wallet_deposits_user_idx on public.wallet_deposits(user_id, created_at desc);
create index if not exists wallet_withdrawals_user_idx on public.wallet_withdrawals(user_id, created_at desc);
create index if not exists wallet_ledger_user_idx on public.wallet_ledger_entries(user_id, asset, created_at desc);

alter table public.wallet_accounts enable row level security;
alter table public.wallet_deposits enable row level security;
alter table public.wallet_withdrawals enable row level security;
alter table public.wallet_ledger_entries enable row level security;

drop policy if exists "Users can view own wallet account" on public.wallet_accounts;
create policy "Users can view own wallet account" on public.wallet_accounts for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own deposits" on public.wallet_deposits;
create policy "Users can view own deposits" on public.wallet_deposits for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own withdrawals" on public.wallet_withdrawals;
create policy "Users can view own withdrawals" on public.wallet_withdrawals for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own ledger" on public.wallet_ledger_entries;
create policy "Users can view own ledger" on public.wallet_ledger_entries for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.wallet_accounts, public.wallet_deposits, public.wallet_withdrawals, public.wallet_ledger_entries from anon;
grant select on public.wallet_accounts, public.wallet_deposits, public.wallet_withdrawals, public.wallet_ledger_entries to authenticated;
