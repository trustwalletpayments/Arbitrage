import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { getAddress, HDNodeWallet, Wallet, JsonRpcProvider, Interface, Contract, parseUnits, formatUnits } from 'ethers';
import { getConfiguredTokenContract } from './token-contracts.js';

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

type NetworkConfig = { name: string; family: string; rpcEnv: string; chainId: number; nativeAsset: string };
const NETWORKS: Record<string, NetworkConfig> = {
  ethereum: { name: 'Ethereum', family: 'evm', rpcEnv: 'ETHEREUM_RPC_URL', chainId: 1, nativeAsset: 'ETH' },
  bsc: { name: 'BNB Smart Chain', family: 'evm', rpcEnv: 'BSC_RPC_URL', chainId: 56, nativeAsset: 'BNB' },
  polygon: { name: 'Polygon', family: 'evm', rpcEnv: 'POLYGON_RPC_URL', chainId: 137, nativeAsset: 'POL' },
  arbitrum: { name: 'Arbitrum One', family: 'evm', rpcEnv: 'ARBITRUM_RPC_URL', chainId: 42161, nativeAsset: 'ETH' },
  optimism: { name: 'Optimism', family: 'evm', rpcEnv: 'OPTIMISM_RPC_URL', chainId: 10, nativeAsset: 'ETH' },
  base: { name: 'Base', family: 'evm', rpcEnv: 'BASE_RPC_URL', chainId: 8453, nativeAsset: 'ETH' },
  avalanche: { name: 'Avalanche C-Chain', family: 'evm', rpcEnv: 'AVALANCHE_RPC_URL', chainId: 43114, nativeAsset: 'AVAX' },
  fantom: { name: 'Fantom', family: 'evm', rpcEnv: 'FANTOM_RPC_URL', chainId: 250, nativeAsset: 'FTM' },
  cronos: { name: 'Cronos', family: 'evm', rpcEnv: 'CRONOS_RPC_URL', chainId: 25, nativeAsset: 'CRO' },
  linea: { name: 'Linea', family: 'evm', rpcEnv: 'LINEA_RPC_URL', chainId: 59144, nativeAsset: 'ETH' },
};
const EVM_ASSETS = new Set(['ETH', 'USDT', 'USDC', 'BNB', 'POL', 'AVAX', 'LINK', 'UNI', 'FTM', 'CRO']);

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
function getRpc(network: string) {
  const config = NETWORKS[network];
  if (!config) throw new Error('Unsupported EVM network.');
  const url = process.env[config.rpcEnv]?.trim();
  if (!url) throw new Error(`${config.rpcEnv} is not configured for ${config.name}.`);
  return new JsonRpcProvider(url, config.chainId);
}
function getTokenContract(network: string, asset: string) {
  return getConfiguredTokenContract(network, asset);
}

app.get('/health', (_req, res) => res.json({
  ok: true,
  service: 'orbitex-wallet-service',
  mode: 'multichain-hd',
  evmNetworks: Object.keys(NETWORKS),
  evmXpubConfigured: Boolean(process.env.EVM_XPUB),
  sweepConfigured: Boolean(process.env.EVM_XPRIV && process.env.TREASURY_PRIVATE_KEY && process.env.TREASURY_ADDRESS),
  sweepEnabled: process.env.SWEEP_ENABLED === 'true',
  evmTokenConfigConfigured: Boolean(process.env.EVM_TOKEN_CONTRACTS_JSON),
}));

app.get('/supported-deposits', authorized, (_req, res) => {
  const routes = Object.entries(NETWORKS).flatMap(([network, config]) => {
    const native = [{ asset: config.nativeAsset, network, type: 'native', ready: true }];
    const tokens = ['USDT', 'USDC', 'LINK', 'UNI'].map(asset => ({ asset, network, type: 'erc20', ready: Boolean(getTokenContract(network, asset)) }));
    return [...native, ...tokens];
  });
  res.json({ ok: true, routes });
});

function getSweepConfig() {
  const xpriv = process.env.EVM_XPRIV?.trim();
  const treasuryKey = process.env.TREASURY_PRIVATE_KEY?.trim();
  const treasuryAddress = process.env.TREASURY_ADDRESS?.trim();
  if (!xpriv || !treasuryKey || !treasuryAddress) throw new Error('Sweep is not configured. Add EVM_XPRIV, TREASURY_PRIVATE_KEY and TREASURY_ADDRESS to the wallet service.');
  return { xpriv, treasuryKey, treasuryAddress: getAddress(treasuryAddress) };
}

async function sweepBscUsdt(walletAccountId: string) {
  const config = getSweepConfig();
  const account = await supabase.from('wallet_accounts').select('id,user_id,asset,network,deposit_address,derivation_index,status').eq('id', walletAccountId).maybeSingle();
  if (account.error) throw new Error(account.error.message);
  if (!account.data) throw new Error('Wallet account not found.');
  if (account.data.asset !== 'USDT' || account.data.network !== 'bsc') throw new Error('Only USDT on BNB Smart Chain is supported by this sweep worker.');
  if (account.data.status !== 'active' || account.data.derivation_index === null || !account.data.deposit_address) throw new Error('Wallet account is not ready for sweeping.');
  const provider = getRpc('bsc');
  const source = HDNodeWallet.fromExtendedKey(config.xpriv).derivePath(`0/${Number(account.data.derivation_index)}`).connect(provider);
  const sourceAddress = getAddress(source.address);
  if (sourceAddress.toLowerCase() !== getAddress(account.data.deposit_address).toLowerCase()) throw new Error('Derived signer does not match the provisioned deposit address.');
  const treasury = new Wallet(config.treasuryKey, provider);
  if (getAddress(treasury.address).toLowerCase() !== config.treasuryAddress.toLowerCase()) throw new Error('TREASURY_PRIVATE_KEY does not match TREASURY_ADDRESS.');
  const usdtAddress = getTokenContract('bsc', 'USDT');
  if (!usdtAddress) throw new Error('USDT contract is not configured for BNB Smart Chain.');
  const usdt = new Contract(usdtAddress, ['function balanceOf(address) view returns (uint256)','function transfer(address to,uint256 amount) returns (bool)'], source);
  const balance = BigInt((await usdt.balanceOf(sourceAddress)).toString());
  if (balance <= 0n) return { ok: true, status: 'nothing_to_sweep', walletAccountId, address: sourceAddress };
  const gasEstimate = await provider.estimateGas({ from: sourceAddress, to: usdtAddress, data: usdt.interface.encodeFunctionData('transfer', [config.treasuryAddress, balance]) });
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.maxFeePerGas || feeData.gasPrice;
  if (!gasPrice) throw new Error('Unable to determine BSC gas price.');
  const requiredGas = gasEstimate * gasPrice;
  const gasBuffer = requiredGas + requiredGas / 2n;
  const sourceNative = await provider.getBalance(sourceAddress);
  let gasTxHash: string | null = null;
  if (sourceNative < gasBuffer) {
    const treasuryNative = await provider.getBalance(treasury.address);
    if (treasuryNative < gasBuffer) throw new Error(`Treasury does not have enough BNB to fund sweep gas. Required approximately ${formatUnits(gasBuffer, 18)} BNB.`);
    const gasTx = await treasury.sendTransaction({ to: sourceAddress, value: gasBuffer - sourceNative });
    gasTxHash = gasTx.hash;
    await gasTx.wait(1);
  }
  const sweep = await supabase.from('wallet_sweeps').insert({ wallet_account_id: account.data.id, user_id: account.data.user_id, asset: 'USDT', network: 'bsc', amount: formatUnits(balance, 18), gas_funded_amount: formatUnits(gasBuffer > sourceNative ? gasBuffer - sourceNative : 0n, 18), gas_tx_hash: gasTxHash, status: 'processing' }).select('id').single();
  if (sweep.error) throw new Error(sweep.error.message);
  try {
    const tx = await usdt.transfer(config.treasuryAddress, balance);
    const receipt = await tx.wait(1);
    if (!receipt || receipt.status !== 1) throw new Error('USDT sweep transaction failed.');
    await supabase.from('wallet_sweeps').update({ status: 'completed', sweep_tx_hash: tx.hash, updated_at: new Date().toISOString() }).eq('id', sweep.data.id);
    return { ok: true, status: 'completed', walletAccountId, address: sourceAddress, amount: formatUnits(balance, 18), gasTxHash, sweepTxHash: tx.hash };
  } catch (error) {
    await supabase.from('wallet_sweeps').update({ status: 'failed', error_message: error instanceof Error ? error.message : 'Sweep failed', updated_at: new Date().toISOString() }).eq('id', sweep.data.id);
    throw error;
  }
}

app.post('/admin/sweep/bsc/usdt/:walletAccountId', authorized, async (req, res) => {
  if (process.env.SWEEP_ENABLED !== 'true') return res.status(503).json({ error: 'Sweep worker is disabled. Set SWEEP_ENABLED=true after configuring the signer and treasury.' });
  try { return res.json(await sweepBscUsdt(String(req.params.walletAccountId))); }
  catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to sweep wallet.' }); }
});

app.post('/provision/:userId', authorized, async (req, res) => {
  const userId = String(req.params.userId);
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
  const network = String(req.body?.network || '').trim().toLowerCase();
  const asset = String(req.body?.asset || '').trim().toUpperCase();
  if (!validateUserId(userId)) return res.status(400).json({ error: 'Invalid user id' });
  if (!/^0x[a-f0-9]{64}$/.test(txHash)) return res.status(400).json({ error: 'Invalid transaction hash' });
  if (!/^\d+(\.\d{1,18})?$/.test(submittedAmount) || Number(submittedAmount) <= 0) return res.status(400).json({ error: 'Invalid amount' });
  const config = NETWORKS[network];
  if (!config) return res.status(400).json({ error: 'Unsupported EVM network.' });
  if (!EVM_ASSETS.has(asset)) return res.status(400).json({ error: 'Unsupported EVM asset.' });
  const account = await supabase.from('wallet_accounts').select('id,deposit_address').eq('user_id', userId).eq('network', network).eq('asset', asset).maybeSingle();
  if (account.error) return res.status(500).json({ error: account.error.message });
  if (!account.data?.deposit_address) return res.status(400).json({ error: `Your ${asset} deposit address has not been provisioned yet.` });
  const existing = await supabase.from('wallet_deposits').select('id,status,user_id').eq('network', network).eq('asset', asset).eq('tx_hash', txHash).maybeSingle();
  if (existing.error) return res.status(500).json({ error: existing.error.message });
  if (existing.data) return res.status(409).json({ error: 'This transaction has already been submitted.', deposit: existing.data });
  try {
    const rpc = getRpc(network);
    const destination = getAddress(account.data.deposit_address);
    const tx = await rpc.getTransaction(txHash);
    const receipt = await rpc.getTransactionReceipt(txHash);
    if (!tx || !receipt || receipt.status !== 1) return res.status(400).json({ error: 'Transaction not found or failed.' });
    const latestBlock = await rpc.getBlockNumber();
    const confirmations = Math.max(0, latestBlock - receipt.blockNumber + 1);
    const iface = new Interface(['event Transfer(address indexed from,address indexed to,uint256 value)']);
    let verifiedFrom = '';
    let verifiedAmount = 0n;
    let decimals = 18;
    const tokenContract = getTokenContract(network, asset);
    if (asset === config.nativeAsset && !tokenContract) {
      if (!tx.to || getAddress(tx.to) !== destination || tx.value <= 0n) return res.status(400).json({ error: `No ${asset} native transfer to your Orbitex deposit address was found.` });
      verifiedFrom = getAddress(tx.from);
      verifiedAmount = tx.value;
    } else {
      if (!tokenContract) return res.status(400).json({ error: `${asset} on ${config.name} is not configured yet. Add its contract to EVM_TOKEN_CONTRACTS_JSON before enabling deposits.` });
      const token = new Contract(tokenContract, ['function decimals() view returns (uint8)'], rpc);
      decimals = Number(await token.decimals());
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== tokenContract.toLowerCase() || log.topics[0]?.toLowerCase() !== transferTopic) continue;
        const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
        if (!parsed) continue;
        const recipient = getAddress(String(parsed.args.to));
        if (recipient.toLowerCase() === destination.toLowerCase()) {
          verifiedFrom = getAddress(String(parsed.args.from));
          verifiedAmount = BigInt(parsed.args.value.toString());
          break;
        }
      }
      if (!verifiedFrom) return res.status(400).json({ error: `No ${asset} token transfer to your Orbitex deposit address was found.` });
    }
    const expectedAmount = parseUnits(submittedAmount, decimals);
    if (verifiedAmount !== expectedAmount) return res.status(400).json({ error: `Amount mismatch. On-chain amount is ${formatUnits(verifiedAmount, decimals)} ${asset}.` });
    const status = confirmations >= confirmationsRequired ? 'credited' : 'confirming';
    const networkLabel = network === 'bsc' ? 'BEP20' : network;
    const inserted = await supabase.rpc('record_verified_wallet_deposit', { p_user_id: userId, p_wallet_account_id: account.data.id, p_asset: asset, p_network: networkLabel, p_chain_family: 'evm', p_tx_hash: txHash, p_from_address: verifiedFrom, p_to_address: destination, p_amount: formatUnits(verifiedAmount, decimals), p_confirmations: confirmations, p_status: status, p_credited_at: status === 'credited' ? new Date().toISOString() : null });
    if (inserted.error) {
      if (inserted.error.code === '23505') return res.status(409).json({ error: 'This transaction has already been submitted.' });
      return res.status(500).json({ error: inserted.error.message });
    }
    return res.status(201).json({ ok: true, status, confirmations, requiredConfirmations: confirmationsRequired, deposit: inserted.data });
  } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to verify transaction' }); }
});

app.listen(port, '0.0.0.0', () => console.log(`Orbitex wallet service listening on port ${port}`));
