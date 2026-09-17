-- Transaction-safe derivation index allocation for custodial deposit addresses.
-- The wallet service must call this function instead of counting wallet rows.

create table if not exists public.wallet_address_allocator (
  id boolean primary key default true check (id = true),
  next_derivation_index bigint not null default 0 check (next_derivation_index >= 0),
  updated_at timestamptz not null default now()
);

insert into public.wallet_address_allocator (id, next_derivation_index)
values (true, 0)
on conflict (id) do nothing;

create or replace function public.allocate_wallet_derivation_index()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  allocated_index bigint;
begin
  update public.wallet_address_allocator
  set next_derivation_index = next_derivation_index + 1,
      updated_at = now()
  where id = true
  returning next_derivation_index - 1 into allocated_index;

  return allocated_index;
end;
$$;

revoke all on function public.allocate_wallet_derivation_index() from public;
revoke all on function public.allocate_wallet_derivation_index() from anon;
revoke all on function public.allocate_wallet_derivation_index() from authenticated;
