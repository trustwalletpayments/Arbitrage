import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { getAddress, HDNodeWallet, JsonRpcProvider, Contract, formatUnits } from 'ethers';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'EVM_XPRIV'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
const provider = new JsonRpcProvider(process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org', 56);
const root = HDNodeWallet.fromExtendedKey(process.env.EVM_XPRIV!.trim());
const usdt = new Contract(getAddress(process.env.USDT_CONTRACT || '0x55d398326f99059fF775485246999027B3197955'), ['function balanceOf(address) view returns (uint256)'], provider);

const indexArg = process.argv[2];
if (indexArg !== undefined && (!/^\d+$/.test(indexArg) || Number(indexArg) < 0)) throw new Error('Usage: npm run recovery -- <derivation-index>');

const check = async (index: number) => {
  const derived = root.derivePath(`0/${index}`);
  const address = getAddress(derived.address);
  const native = await provider.getBalance(address);
  const token = await usdt.balanceOf(address);
  const account = await supabase.from('wallet_accounts').select('id,user_id,deposit_address,derivation_index,status').eq('network', 'bsc').eq('asset', 'USDT').eq('derivation_index', index).maybeSingle();
  if (account.error) throw new Error(account.error.message);
  const matches = !account.data || getAddress(account.data.deposit_address).toLowerCase() === address.toLowerCase();
  await supabase.from('wallet_recovery_checks').insert({ wallet_account_id: account.data?.id ?? null, derivation_index: index, derived_address: address, network: 'bsc', usdt_balance: formatUnits(token, 18), native_balance: formatUnits(native, 18), status: matches ? 'ok' : 'mismatch', error_message: matches ? null : 'Stored deposit address does not match deterministic derivation.' });
  console.log(JSON.stringify({ index, address, usdt: formatUnits(token, 18), bnb: formatUnits(native, 18), databaseMapping: account.data ? { userId: account.data.user_id, walletId: account.data.id, status: account.data.status } : null, mappingMatches: matches }, null, 2));
};

const main = async () => {
  if (indexArg !== undefined) return check(Number(indexArg));
  const { data, error } = await supabase.from('wallet_accounts').select('derivation_index').eq('network', 'bsc').eq('asset', 'USDT').not('derivation_index', 'is', null).order('derivation_index');
  if (error) throw new Error(error.message);
  for (const row of data || []) await check(Number(row.derivation_index));
};
main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
