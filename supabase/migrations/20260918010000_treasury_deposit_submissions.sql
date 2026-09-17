-- Common treasury deposit flow for USDT BEP-20.
-- Deposits are linked to a user only after the user submits a transaction hash.

alter table public.wallet_deposits
  alter column wallet_account_id drop not null;

alter table public.wallet_deposits
  drop constraint if exists wallet_deposits_status_check;

alter table public.wallet_deposits
  add constraint wallet_deposits_status_check
  check (status in ('submitted','detected','confirming','credited','rejected'));

create index if not exists wallet_deposits_tx_hash_idx
  on public.wallet_deposits(tx_hash);
