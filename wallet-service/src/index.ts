import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { getAddress, HDNodeWallet, JsonRpcProvider, Interface, parseUnits, formatUnits } from 'ethers';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_API_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
}

const app = express();
app.use(express.json({ limit: '32kb' }));
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
const apiKey = process.env.ADMIN_API_KEY!;
const port = Number(process.env.PORT || 8080);
const confirmationsRequired = Number(process.env.CONFIRMATIONS_REQUIRED || 15);
const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a9df523b3ef';

const NETWORKS: Record<string, { name: string; family: string; rpcEnv: string; chainId: number }> = {
  ethereum: { name: 'Ethereum', family: 'evm', rpcEnv: 'ETHEREUM_RPC_URL', chainId: 1 },
  bsc: { name: 'BNB Smart Chain', family: 'evm', rpcEnv: 'BSC_RPC_URL', chainId: 56 },
  polygon: { name: 'Polygon', family: 'evm', rpcEnv: 'POLYGON_RPC_URL', chainId: 137 },
  arbitrum: { name: 'Arbitrum One', family: 'evm', rpcEnv: 'ARBITRUM_RPC_URL', chainId: 42161 },
  optimism: { name: 'Optimism', family: 'evm', rpcEnv: 'OPTIMISM_RPC_URL', chainId: 10 },
  base: { name: 'Base', family: 'evm', rpcEnv: 'BASE_RPC_URL', chainId: 8453 },
  avalanche: { name: 'Avalanche C-Chain', family: 'evm', rpcEnv: 'AVALANCHE_RPC_URL', chainId: 43114 },
  fantom: { name: 'Fantom', family: 'evm', rpcEnv: 'FANTOM_RPC_URL', chainId: 250 },
  cronos: { name: 'Cronos', family: 'evm', rpcEnv: 'CRONOS_RPC_URL', chainId: 25 },
  linea: { name: 'Linea', family: 'evm', rpcEnv: 'LINEA_RPC_URL', chainId: 59144 },
};
const EVM_ASSETS = new Set(['ETH', 'USDT', 'USDC', 'BNB', 'POL', 'AVAX', 'LINK', 'UNI']);

function authorized(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.header('x-wallet-service-key') !== apiKey) return res.status(401).json({ error: 'Unauthorized' });
  next();
}
function validateUserId(userId: string) { return /^[0-9a-f-]{36}$/i.test(userId); }
function getEvmXpub() {
  const value = process.env.EVM_XPUB?.trim();
  if (!value) throw new Error('EVM_XPUB is not configured. Add an account-level Ethereum extended public key to the wallet service.');
  return value;
}
async function getOrAllocateEvmIndex(userId: string): Promise<number> {
  const existing = await supabase.from('wallet_accounts').select('derivation_index').eq('user_id', userId).eq('chain_family', 'evm').not('derivation_index', 'is', null).limit(1).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.derivation_index !== null && existing.data?.derivation_index !== undefined) return Number(existing.data.derivation_index);
  const allocated = await supabase.rpc('allocate_wallet_derivation_index');
  if (allocated.error) throw new Error(`Unable to allocate wallet index: ${allocated.error.message}`);
  const index = Number(allocated.data);
  if (!Number.isInteger(index) || index < 0) throw new Error('Wallet derivation allocator returned an invalid index.');
  return index;
}
function deriveEvmAddress(index: number) {
  const root = HDNodeWallet.fromExtendedKey(getEvmXpub());
  return getAddress(root.derivePath(`0/${index}`).address);
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'orbitex-wallet-service', mode: 'multichain-hd', evmNetworks: Object.keys(NETWORKS), evmXpubConfigured: Boolean(process.env.EVM_XPUB) }));

app.post('/provision/:userId', authorized, async (req, res) => {
  const userId = req.params.userId;
  const asset = String(req.body?.asset || '').trim().toUpperCase();
  const network = String(req.body?.network || '').trim().toLowerCase();
  if (!validateUserId(userId)) return res.status(400).json({ error: 'Invalid user id' });
  if (!EVM_ASSETS.has(asset)) return res.status(400).json({ error: 'Unsupported EVM asset' });
  if (!NETWORKS[network]) return res.status(400).json({ error: 'Unsupported EVM network' });
  try {
    const existing = await supabase.from('wallet_accounts').select('*').eq('user_id', userId).eq('asset', asset).eq('network', network).maybeSingle();
    if (existing.error) return res.status(500).json({ error: existing.error.message });
    if (existing.data) return res.json({ ok: true, wallet: existing.data, created: false });
    const index = await getOrAllocateEvmIndex(userId);
    const address = deriveEvmAddress(index);
    const inserted = await supabase.from('wallet_accounts').insert({ user_id: userId, asset, network, chain_family: 'evm', deposit_address: address, derivation_index: index, status: 'active' }).select('*').single();
    if (inserted.error) {
      const retry = await supabase.from('wallet_accounts').select('*').eq('user_id', userId).eq('asset', asset).eq('network', network).maybeSingle();
      if (!retry.error && retry.data) return res.json({ ok: true, wallet: retry.data, created: false });
      return res.status(500).json({ error: inserted.error.message });
    }
    return res.status(201).json({ ok: true, wallet: inserted.data, created: true });
  } catch (error) { return res.status(500).json({ error: error instanceof Error ? error.message : 'Unable to provision wallet' }); }
});

app.post('/verify-deposit', authorized, async (req, res) => {
  const userId = String(req.body?.userId || '');
  const txHash = String(req.body?.txHash || '').trim().toLowerCase();
  const submittedAmount = String(req.body?.amount || '').trim();
  const network = String(req.body?.network || 'bsc').trim().toLowerCase();
  const asset = String(req.body?.asset || 'USDT').trim().toUpperCase();
  if (!validateUserId(userId)) return res.status(400).json({ error: 'Invalid user id' });
  if (!/^0x[a-f0-9]{64}$/.test(txHash)) return res.status(400).json({ error: 'Invalid transaction hash' });
  if (!/^\d+(\.\d{1,18})?$/.test(submittedAmount) || Number(submittedAmount) <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (network !== 'bsc' || asset !== 'USDT') return res.status(400).json({ error: 'Deposit verification for this network/asset is not enabled yet.' });

  const account = await supabase.from('wallet_accounts').select('id,deposit_address').eq('user_id', userId).eq('network', 'bsc').eq('asset', 'USDT').maybeSingle();
  if (account.error) return res.status(500).json({ error: account.error.message });
  if (!account.data?.deposit_address) return res.status(400).json({ error: 'Your USDT BEP-20 deposit address has not been provisioned yet.' });

  const existing = await supabase.from('wallet_deposits').select('id,status,user_id').eq('network', 'BEP20').eq('asset', 'USDT').eq('tx_hash', txHash).maybeSingle();
  if (existing.error) return res.status(500).json({ error: existing.error.message });
  if (existing.data) return res.status(409).json({ error: 'This transaction has already been submitted.', deposit: existing.data });

  try {
    const rpc = new JsonRpcProvider(process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org');
    const usdtContract = getAddress(process.env.USDT_CONTRACT || '0x55d398326f99059fF775485246999027B3197955');
    const destination = getAddress(account.data.deposit_address);
    const tx = await rpc.getTransaction(txHash);
    const receipt = await rpc.getTransactionReceipt(txHash);
    if (!tx || !receipt || receipt.status !== 1) return res.status(400).json({ error: 'Transaction not found or failed.' });
    const latestBlock = await rpc.getBlockNumber();
    const confirmations = Math.max(0, latestBlock - receipt.blockNumber + 1);
    const iface = new Interface(['event Transfer(address indexed from,address indexed to,uint256 value)']);
    let verifiedFrom = '';
    let verifiedAmount = 0n;
    let matched = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== usdtContract.toLowerCase() || log.topics[0]?.toLowerCase() !== transferTopic) continue;
      const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
      if (!parsed) continue;
      const recipient = getAddress(String(parsed.args.to));
      if (recipient.toLowerCase() === destination.toLowerCase()) {
        matched = true;
        verifiedFrom = getAddress(String(parsed.args.from));
        verifiedAmount = BigInt(parsed.args.value.toString());
        break;
      }
    }
    if (!matched) return res.status(400).json({ error: 'No USDT transfer to your Orbitex deposit address was found.' });
    const expectedAmount = parseUnits(submittedAmount, 18);
    if (verifiedAmount !== expectedAmount) return res.status(400).json({ error: `Amount mismatch. On-chain amount is ${formatUnits(verifiedAmount, 18)} USDT.` });
    const status = confirmations >= confirmationsRequired ? 'credited' : 'confirming';
    const inserted = await supabase.from('wallet_deposits').insert({ user_id: userId, wallet_account_id: account.data.id, asset: 'USDT', network: 'BEP20', chain_family: 'evm', tx_hash: txHash, from_address: verifiedFrom, to_address: destination, amount: formatUnits(verifiedAmount, 18), confirmations, status, credited_at: status === 'credited' ? new Date().toISOString() : null }).select('*').single();
    if (inserted.error) return res.status(500).json({ error: inserted.error.message });
    if (status === 'credited') {
      const ledger = await supabase.from('wallet_ledger_entries').insert({ user_id: userId, asset: 'USDT', entry_type: 'deposit', amount: formatUnits(verifiedAmount, 18), reference_id: inserted.data.id, description: `Verified BEP-20 USDT deposit ${txHash}` });
      if (ledger.error) return res.status(500).json({ error: ledger.error.message, deposit: inserted.data });
    }
    return res.status(201).json({ ok: true, status, confirmations, requiredConfirmations: confirmationsRequired, deposit: inserted.data });
  } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to verify transaction' }); }
});

app.listen(port, '0.0.0.0', () => console.log(`Orbitex wallet service listening on port ${port}`));
