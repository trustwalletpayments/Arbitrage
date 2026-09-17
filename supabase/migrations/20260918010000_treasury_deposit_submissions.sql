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

-- Users may submit only their own pending transaction claims.
grant insert on public.wallet_deposits to authenticated;

drop policy if exists "Users can submit own wallet deposits" on public.wallet_deposits;
create policy "Users can submit own wallet deposits"
on public.wallet_deposits
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'submitted'
  and wallet_account_id is null
  and asset = 'USDT'
  and network = 'BEP20'
);
