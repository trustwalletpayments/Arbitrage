-- ORBITEX exchange core schema
-- Apply this migration to the dedicated ORBITEX Supabase project (NOT the VIP/algo project).

create extension if not exists pgcrypto;

do $$ begin
  create type public.order_side as enum ('BUY','SELL');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.order_type as enum ('MARKET','LIMIT');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.order_status as enum ('NEW','OPEN','PARTIALLY_FILLED','FILLED','CANCELED','REJECTED');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.ledger_wallet as enum ('SPOT','FUTURES');
exception when duplicate_object then null; end $$;

create table if not exists public.assets (
  symbol text primary key,
  name text not null,
  decimals integer not null default 8 check (decimals between 0 and 18),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.markets (
  symbol text primary key,
  base_asset text not null references public.assets(symbol),
  quote_asset text not null references public.assets(symbol),
  price_precision integer not null default 8,
  quantity_precision integer not null default 8,
  min_quantity numeric(38,18) not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.account_balances (
  user_id uuid not null references auth.users(id) on delete cascade,
  asset text not null references public.assets(symbol),
  wallet public.ledger_wallet not null,
  available numeric(38,18) not null default 0 check (available >= 0),
  locked numeric(38,18) not null default 0 check (locked >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, asset, wallet)
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  asset text not null references public.assets(symbol),
  wallet public.ledger_wallet not null,
  amount numeric(38,18) not null check (amount <> 0),
  reference_type text not null,
  reference_id uuid,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  market text not null references public.markets(symbol),
  side public.order_side not null,
  type public.order_type not null,
  price numeric(38,18),
  quantity numeric(38,18) not null check (quantity > 0),
  filled_quantity numeric(38,18) not null default 0 check (filled_quantity >= 0),
  status public.order_status not null default 'NEW',
  client_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((type = 'MARKET') or (price is not null and price > 0))
);

create unique index if not exists orders_user_client_order_id_idx
  on public.orders(user_id, client_order_id)
  where client_order_id is not null;

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  market text not null references public.markets(symbol),
  side public.order_side not null,
  price numeric(38,18) not null check (price > 0),
  quantity numeric(38,18) not null check (quantity > 0),
  fee numeric(38,18) not null default 0 check (fee >= 0),
  fee_asset text references public.assets(symbol),
  created_at timestamptz not null default now()
);

create table if not exists public.futures_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  market text not null references public.markets(symbol),
  side text not null check (side in ('LONG','SHORT')),
  entry_price numeric(38,18) not null check (entry_price > 0),
  quantity numeric(38,18) not null check (quantity > 0),
  leverage numeric(10,2) not null check (leverage >= 1 and leverage <= 125),
  margin numeric(38,18) not null check (margin > 0),
  take_profit numeric(38,18),
  stop_loss numeric(38,18),
  liquidation_price numeric(38,18) not null check (liquidation_price > 0),
  status text not null default 'OPEN' check (status in ('OPEN','CLOSED','TP_HIT','SL_HIT','LIQUIDATED')),
  realized_pnl numeric(38,18) not null default 0,
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists account_balances_user_idx on public.account_balances(user_id);
create index if not exists ledger_entries_user_created_idx on public.ledger_entries(user_id, created_at desc);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists trades_user_created_idx on public.trades(user_id, created_at desc);
create index if not exists futures_positions_user_status_idx on public.futures_positions(user_id, status);

alter table public.assets enable row level security;
alter table public.markets enable row level security;
alter table public.account_balances enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.orders enable row level security;
alter table public.trades enable row level security;
alter table public.futures_positions enable row level security;

-- Public market metadata is readable; writes belong to trusted server/admin code.
drop policy if exists assets_read on public.assets;
create policy assets_read on public.assets for select using (enabled = true);
drop policy if exists markets_read on public.markets;
create policy markets_read on public.markets for select using (enabled = true);

-- Users can read their own account records. Balance/ledger/order mutations must be server-side.
drop policy if exists balances_read_own on public.account_balances;
create policy balances_read_own on public.account_balances for select using (auth.uid() = user_id);
drop policy if exists ledger_read_own on public.ledger_entries;
create policy ledger_read_own on public.ledger_entries for select using (auth.uid() = user_id);
drop policy if exists orders_read_own on public.orders;
create policy orders_read_own on public.orders for select using (auth.uid() = user_id);
drop policy if exists trades_read_own on public.trades;
create policy trades_read_own on public.trades for select using (auth.uid() = user_id);
drop policy if exists futures_read_own on public.futures_positions;
create policy futures_read_own on public.futures_positions for select using (auth.uid() = user_id);
