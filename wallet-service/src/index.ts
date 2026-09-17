import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { getAddress, JsonRpcProvider, Interface, parseUnits, formatUnits } from 'ethers';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_API_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
}

const app = express();
app.use(express.json({ limit: '32kb' }));

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const apiKey = process.env.ADMIN_API_KEY!;
const port = Number(process.env.PORT || 8080);
const rpc = new JsonRpcProvider(process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org');
const usdtContract = getAddress(process.env.USDT_CONTRACT || '0x55d398326f99059fF775485246999027B3197955');
const treasuryAddress = getAddress(process.env.TREASURY_ADDRESS || '0x43A690962edb1a5198E856E95fdEE68cFF4F0E83');
const requiredConfirmations = Number(process.env.CONFIRMATIONS_REQUIRED || 15);
const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a9df523b3ef';

function authorized(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.header('x-wallet-service-key') !== apiKey) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'orbitex-wallet-service', network: 'BEP20', asset: 'USDT', custody: 'common-treasury' });
});

app.post('/provision/:userId', authorized, async (_req, res) => {
  return res.status(410).json({ error: 'Per-user wallet provisioning is disabled. Orbitex uses the common treasury address.' });
});

app.post('/verify-deposit', authorized, async (req, res) => {
  const userId = String(req.body?.userId || '');
  const txHash = String(req.body?.txHash || '').trim().toLowerCase();
  const submittedAmount = String(req.body?.amount || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return res.status(400).json({ error: 'Invalid user id' });
  if (!/^0x[a-f0-9]{64}$/.test(txHash)) return res.status(400).json({ error: 'Invalid transaction hash' });
  if (!/^\d+(\.\d{1,18})?$/.test(submittedAmount) || Number(submittedAmount) <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const existing = await supabase.from('wallet_deposits').select('id,status,user_id').eq('network', 'BEP20').eq('asset', 'USDT').eq('tx_hash', txHash).maybeSingle();
  if (existing.error) return res.status(500).json({ error: existing.error.message });
  if (existing.data) return res.status(409).json({ error: 'This transaction has already been submitted.', deposit: existing.data });

  try {
    const tx = await rpc.getTransaction(txHash);
    const receipt = await rpc.getTransactionReceipt(txHash);
    if (!tx || !receipt || receipt.status !== 1) return res.status(400).json({ error: 'Transaction not found or failed.' });
    if (!tx.to || getAddress(tx.to) !== usdtContract) return res.status(400).json({ error: 'Transaction is not a USDT contract transfer.' });

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
      if (recipient.toLowerCase() === treasuryAddress.toLowerCase()) {
        matched = true;
        verifiedFrom = getAddress(String(parsed.args.from));
        verifiedAmount = BigInt(parsed.args.value.toString());
        break;
      }
    }
    if (!matched) return res.status(400).json({ error: 'No USDT transfer to the Orbitex treasury address was found.' });
    const expectedAmount = parseUnits(submittedAmount, 18);
    if (verifiedAmount !== expectedAmount) return res.status(400).json({ error: `Amount mismatch. On-chain amount is ${formatUnits(verifiedAmount, 18)} USDT.` });

    const status = confirmations >= requiredConfirmations ? 'credited' : 'confirming';
    const inserted = await supabase.from('wallet_deposits').insert({ user_id: userId, wallet_account_id: null, asset: 'USDT', network: 'BEP20', tx_hash: txHash, from_address: verifiedFrom, to_address: treasuryAddress, amount: formatUnits(verifiedAmount, 18), confirmations, status, credited_at: status === 'credited' ? new Date().toISOString() : null }).select('*').single();
    if (inserted.error) return res.status(500).json({ error: inserted.error.message });

    if (status === 'credited') {
      const ledger = await supabase.from('wallet_ledger_entries').insert({ user_id: userId, asset: 'USDT', entry_type: 'deposit', amount: formatUnits(verifiedAmount, 18), reference_id: inserted.data.id, description: `Verified BEP-20 USDT deposit ${txHash}` });
      if (ledger.error) return res.status(500).json({ error: ledger.error.message, deposit: inserted.data });
    }
    return res.status(201).json({ ok: true, status, confirmations, requiredConfirmations, deposit: inserted.data });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to verify transaction' });
  }
});

app.listen(port, '0.0.0.0', () => console.log(`Orbitex wallet service listening on port ${port}`));
