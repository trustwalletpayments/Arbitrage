-- Common treasury-address deposit submissions.
-- Users submit a transaction hash; a trusted verifier must validate it on-chain
-- before changing the record to credited and writing a ledger entry.

alter table public.wallet_deposits
  alter column wallet_account_id drop not null;

alter table public.wallet_deposits
  drop constraint if exists wallet_deposits_status_check;

alter table public.wallet_deposits
  add constraint wallet_deposits_status_check
  check (status in ('submitted','detected','confirming','credited','rejected'));

create policy "Users can submit own deposits"
  on public.wallet_deposits
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and asset = 'USDT'
    and network = 'BEP20'
    and wallet_account_id is null
    and status = 'submitted'
  );

grant insert on public.wallet_deposits to authenticated;
