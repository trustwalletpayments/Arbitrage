-- Orbitex multi-chain wallet foundation.
-- Private keys/seed phrases stay out of the application.

alter table public.wallet_accounts drop constraint if exists wallet_accounts_user_id_key;
alter table public.wallet_accounts add column if not exists derivation_index integer;
alter table public.wallet_accounts add column if not exists chain_family text not null default 'evm';
alter table public.wallet_accounts add constraint wallet_accounts_asset_network_deposit_address_key unique (asset, network, deposit_address);
create unique index if not exists wallet_accounts_user_network_asset_idx on public.wallet_accounts(user_id, network, asset);
create index if not exists wallet_accounts_address_idx on public.wallet_accounts(network, deposit_address);

alter table public.wallet_deposits alter column wallet_account_id drop not null;
alter table public.wallet_deposits add column if not exists chain_family text not null default 'evm';

create table if not exists public.wallet_networks (
  id text primary key,
  name text not null,
  family text not null,
  native_asset text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.wallet_networks (id, name, family, native_asset, enabled) values
('ethereum','Ethereum','evm','ETH',true),('bsc','BNB Smart Chain','evm','BNB',true),
('polygon','Polygon','evm','POL',false),('arbitrum','Arbitrum One','evm','ETH',false),
('optimism','Optimism','evm','ETH',false),('base','Base','evm','ETH',false),
('avalanche','Avalanche C-Chain','evm','AVAX',false),('fantom','Fantom','evm','FTM',false),
('cronos','Cronos','evm','CRO',false),('linea','Linea','evm','ETH',false),
('bitcoin','Bitcoin','bitcoin','BTC',false),('tron','TRON','tron','TRX',false),
('solana','Solana','solana','SOL',false),('xrp','XRP Ledger','xrp','XRP',false),
('cardano','Cardano','cardano','ADA',false),('dogecoin','Dogecoin','dogecoin','DOGE',false),
('litecoin','Litecoin','litecoin','LTC',false),('bitcoin-cash','Bitcoin Cash','bitcoincash','BCH',false),
('sui','Sui','sui','SUI',false),('aptos','Aptos','aptos','APT',false)
on conflict (id) do update set name=excluded.name, family=excluded.family, native_asset=excluded.native_asset;

alter table public.wallet_networks enable row level security;
drop policy if exists "Anyone can view enabled wallet networks" on public.wallet_networks;
create policy "Anyone can view enabled wallet networks" on public.wallet_networks for select to authenticated using (enabled = true);
grant select on public.wallet_networks to authenticated;
