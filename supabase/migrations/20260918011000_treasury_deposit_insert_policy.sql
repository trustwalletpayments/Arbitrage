-- Allow authenticated users to submit their own treasury deposit transaction hash.
-- Verification and ledger crediting remain service-role-only backend operations.

grant insert on public.wallet_deposits to authenticated;

drop policy if exists "Users can submit own deposits" on public.wallet_deposits;
create policy "Users can submit own deposits"
on public.wallet_deposits
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and wallet_account_id is null
  and asset = 'USDT'
  and network = 'BEP20'
  and status = 'submitted'
  and to_address = '0x43A690962edb1a5198E856E95fdEE68cFF4F0E83'
);
