-- ORBITEX testnet spot engine. Apply after 20260911_exchange_core.sql.
-- This is a server-side simulated matching/fill engine for development only.

insert into public.assets (symbol,name,decimals) values
 ('USDT','Tether USD',6),('BTC','Bitcoin',8),('ETH','Ethereum',8),('SOL','Solana',8),
 ('BNB','BNB',8),('XRP','XRP',8),('DOGE','Dogecoin',8),('ADA','Cardano',8),
 ('AVAX','Avalanche',8),('LINK','Chainlink',8),('DOT','Polkadot',8),('TRX','TRON',8),
 ('LTC','Litecoin',8),('BCH','Bitcoin Cash',8),('UNI','Uniswap',8),('ATOM','Cosmos',8),
 ('NEAR','NEAR Protocol',8),('APT','Aptos',8),('SUI','Sui',8),('ARB','Arbitrum',8)
on conflict (symbol) do update set name=excluded.name, enabled=true;

insert into public.markets (symbol,base_asset,quote_asset,price_precision,quantity_precision,min_quantity) values
 ('BTC/USDT','BTC','USDT',2,6,0.000001),('ETH/USDT','ETH','USDT',2,5,0.00001),
 ('SOL/USDT','SOL','USDT',4,4,0.0001),('BNB/USDT','BNB','USDT',2,4,0.0001),
 ('XRP/USDT','XRP','USDT',5,2,0.01),('DOGE/USDT','DOGE','USDT',6,0,1),
 ('ADA/USDT','ADA','USDT',5,1,0.1),('AVAX/USDT','AVAX','USDT',2,4,0.0001),
 ('LINK/USDT','LINK','USDT',3,4,0.0001),('DOT/USDT','DOT','USDT',3,4,0.0001),
 ('TRX/USDT','TRX','USDT',5,0,1),('LTC/USDT','LTC','USDT',2,4,0.0001),
 ('BCH/USDT','BCH','USDT',2,4,0.0001),('UNI/USDT','UNI','USDT',3,4,0.0001),
 ('ATOM/USDT','ATOM','USDT',3,4,0.0001),('NEAR/USDT','NEAR','USDT',3,4,0.0001),
 ('APT/USDT','APT','USDT',3,4,0.0001),('SUI/USDT','SUI','USDT',4,4,0.0001),
 ('ARB/USDT','ARB','USDT',4,4,0.0001)
on conflict (symbol) do update set enabled=true;

create or replace function public.execute_testnet_spot_order(
  p_user_id uuid,
  p_market text,
  p_side public.order_side,
  p_type public.order_type,
  p_price numeric,
  p_quantity numeric,
  p_client_order_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market public.markets%rowtype;
  v_order public.orders%rowtype;
  v_quote public.account_balances%rowtype;
  v_base public.account_balances%rowtype;
  v_cost numeric;
  v_fee numeric;
  v_base_fill numeric;
  v_quote_fill numeric;
  v_trade_id uuid;
  v_existing public.orders%rowtype;
begin
  if p_user_id is null then raise exception 'Authentication required'; end if;
  if p_price is null or p_price <= 0 then raise exception 'Price must be positive'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be positive'; end if;

  select * into v_market from public.markets where symbol=p_market and enabled=true for share;
  if not found then raise exception 'Market is not enabled'; end if;
  if p_quantity < v_market.min_quantity then raise exception 'Quantity is below the market minimum'; end if;

  if p_client_order_id is not null then
    select * into v_existing from public.orders where user_id=p_user_id and client_order_id=p_client_order_id;
    if found then
      return jsonb_build_object('order',to_jsonb(v_existing),'replayed',true);
    end if;
  end if;

  insert into public.account_balances(user_id,asset,wallet) values
    (p_user_id,v_market.quote_asset,'SPOT'),(p_user_id,v_market.base_asset,'SPOT')
  on conflict do nothing;

  select * into v_quote from public.account_balances where user_id=p_user_id and asset=v_market.quote_asset and wallet='SPOT' for update;
  select * into v_base from public.account_balances where user_id=p_user_id and asset=v_market.base_asset and wallet='SPOT' for update;

  v_cost := p_price * p_quantity;
  v_fee := v_cost * 0.001;

  if p_side='BUY' then
    if v_quote.available < v_cost + v_fee then raise exception 'Insufficient USDT balance'; end if;
    update public.account_balances set available=available-v_cost-v_fee, updated_at=now() where user_id=p_user_id and asset=v_market.quote_asset and wallet='SPOT';
    update public.account_balances set available=available+p_quantity, updated_at=now() where user_id=p_user_id and asset=v_market.base_asset and wallet='SPOT';
    v_base_fill := p_quantity; v_quote_fill := v_cost;
  else
    if v_base.available < p_quantity then raise exception 'Insufficient base asset balance'; end if;
    update public.account_balances set available=available-p_quantity, updated_at=now() where user_id=p_user_id and asset=v_market.base_asset and wallet='SPOT';
    update public.account_balances set available=available+v_cost-v_fee, updated_at=now() where user_id=p_user_id and asset=v_market.quote_asset and wallet='SPOT';
    v_base_fill := p_quantity; v_quote_fill := v_cost;
  end if;

  insert into public.orders(user_id,market,side,type,price,quantity,filled_quantity,status,client_order_id,updated_at)
  values(p_user_id,p_market,p_side,p_type,p_price,p_quantity,p_quantity,'FILLED',p_client_order_id,now())
  returning * into v_order;

  insert into public.trades(order_id,user_id,market,side,price,quantity,fee,fee_asset)
  values(v_order.id,p_user_id,p_market,p_side,p_price,p_quantity,v_fee,case when p_side='BUY' then v_market.quote_asset else v_market.quote_asset end)
  returning id into v_trade_id;

  insert into public.ledger_entries(user_id,asset,wallet,amount,reference_type,reference_id)
  values
   (p_user_id,v_market.base_asset,'SPOT',case when p_side='BUY' then v_base_fill else -v_base_fill end,'TRADE',v_order.id),
   (p_user_id,v_market.quote_asset,'SPOT',case when p_side='BUY' then -v_quote_fill-v_fee else v_quote_fill-v_fee end,'TRADE',v_order.id),
   (p_user_id,v_market.quote_asset,'SPOT',v_fee,'FEE',v_order.id);

  return jsonb_build_object('order',to_jsonb(v_order),'trade_id',v_trade_id,'fee',v_fee,'message','Testnet spot order filled. No real funds were moved.');
end;
$$;

revoke all on function public.execute_testnet_spot_order(uuid,text,public.order_side,public.order_type,numeric,numeric,text) from public;
grant execute on function public.execute_testnet_spot_order(uuid,text,public.order_side,public.order_type,numeric,numeric,text) to authenticated;
