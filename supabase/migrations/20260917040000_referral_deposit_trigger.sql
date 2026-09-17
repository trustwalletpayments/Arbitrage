-- ORBITEX referral integration for confirmed ledger deposits.
-- This connects qualifying positive deposit ledger entries to the trusted
-- referral settlement function. It does not touch the airdrop program.

create or replace function public.handle_referral_deposit_ledger_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  deposit_reference text;
begin
  -- Only confirmed deposit credits are eligible. Trades, fees, withdrawals,
  -- and other ledger movements are intentionally ignored.
  if new.amount <= 0
     or lower(trim(new.reference_type)) not in ('deposit', 'crypto_deposit', 'confirmed_deposit') then
    return new;
  end if;

  deposit_reference := coalesce(new.reference_id::text, new.id::text);

  perform public.process_referral_deposit(
    new.user_id,
    deposit_reference,
    new.amount,
    new.asset
  );

  return new;
end;
$$;

revoke all on function public.handle_referral_deposit_ledger_entry() from public, anon, authenticated;

drop trigger if exists ledger_entries_referral_deposit_trigger on public.ledger_entries;
create trigger ledger_entries_referral_deposit_trigger
after insert on public.ledger_entries
for each row
execute function public.handle_referral_deposit_ledger_entry();
