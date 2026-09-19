import 'dotenv/config';
import { createServer } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { scanBitcoinDeposit, bitcoinTipHeight } from './chains/bitcoin-adapter.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const INTERVAL_MS = Math.max(
  15_000,
  Number(process.env.BITCOIN_MONITOR_INTERVAL_MS || 30_000),
);
const MAX_ACCOUNTS = Math.max(
  1,
  Number(process.env.BITCOIN_MONITOR_MAX_ACCOUNTS_PER_RUN || 200),
);
function confirmationsRequired() {
  const raw = Number(process.env.BITCOIN_CONFIRMATIONS_REQUIRED);
  if (!Number.isInteger(raw) || raw < 1) {
    throw new Error(
      'BITCOIN_CONFIRMATIONS_REQUIRED must be set to an integer >= 1.',
    );
  }
  return raw;
}

let running = false;

const healthPort = Number(process.env.PORT || 8080);
createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      service: 'orbitex-bitcoin-monitor',
      bitcoinMonitorEnabled: process.env.BITCOIN_MONITOR_ENABLED === 'true',
    }));
    return;
  }
  res.writeHead(404);
  res.end();
}).listen(healthPort, '0.0.0.0');

function validateConfig() {
  if (!process.env.BITCOIN_RPC_URL?.trim()) {
    throw new Error('BITCOIN_RPC_URL is not configured.');
  }
  if (
    !process.env.BITCOIN_ZPUB?.trim() &&
    !process.env.BITCOIN_XPUB?.trim()
  ) {
    throw new Error('BITCOIN_ZPUB or BITCOIN_XPUB is not configured.');
  }
  if (
    !process.env.SUPABASE_URL?.trim() ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  ) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.',
    );
  }
}

async function scanAccount(account: {
  id: string;
  user_id: string;
  deposit_address: string;
}) {
  const tip = await bitcoinTipHeight();
  const utxos = await scanBitcoinDeposit(account.deposit_address, 1);
  if (!utxos.length) return;

  const byTransaction = new Map<
    string,
    { amountSats: bigint; confirmations: number }
  >();

  for (const utxo of utxos) {
    const confirmations = Math.max(0, tip - utxo.height + 1);
    const current = byTransaction.get(utxo.txid);

    if (current) {
      current.amountSats += utxo.valueSats;
      current.confirmations = Math.max(
        current.confirmations,
        confirmations,
      );
    } else {
      byTransaction.set(utxo.txid, {
        amountSats: utxo.valueSats,
        confirmations,
      });
    }
  }

  for (const [txHash, deposit] of byTransaction) {
    const amount = (Number(deposit.amountSats) / 100_000_000).toFixed(8);

    const existing = await supabase
      .from('wallet_deposits')
      .select('id,status,confirmations,amount')
      .eq('network', 'bitcoin')
      .eq('asset', 'BTC')
      .eq('tx_hash', txHash)
      .maybeSingle();

    if (existing.error) throw new Error(existing.error.message);

    if (!existing.data) {
      const inserted = await supabase.from('wallet_deposits').insert({
        user_id: account.user_id,
        wallet_account_id: account.id,
        asset: 'BTC',
        network: 'bitcoin',
        chain_family: 'bitcoin',
        tx_hash: txHash,
        from_address: null,
        to_address: account.deposit_address,
        amount,
        confirmations: deposit.confirmations,
        status: 'detected',
      });

      if (inserted.error) throw new Error(inserted.error.message);

      console.log(
        `[bitcoin] detected account=${account.id} tx=${txHash} amount=${amount} BTC confirmations=${deposit.confirmations}`,
      );
      continue;
    }

    // Step 2 intentionally stops at confirmation tracking.
    // Balance crediting stays disabled until the later ledger integration step.
    if (existing.data.status === 'rejected') continue;

    const nextStatus = 'confirming';
    if (
      Number(existing.data.confirmations) !== deposit.confirmations ||
      String(existing.data.amount) !== amount ||
      existing.data.status !== nextStatus
    ) {
      const updated = await supabase
        .from('wallet_deposits')
        .update({
          confirmations: deposit.confirmations,
          amount,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.data.id);

      if (updated.error) throw new Error(updated.error.message);
    }

    const requiredConfirmations = confirmationsRequired();
    if (deposit.confirmations >= requiredConfirmations) {
      console.log(
        `[bitcoin] confirmed account=${account.id} tx=${txHash} confirmations=${deposit.confirmations}; balance credit remains disabled until ledger integration`,
      );
    }
  }
}

async function runBitcoinMonitorCycle() {
  if (
    running ||
    process.env.BITCOIN_MONITOR_ENABLED !== 'true'
  ) {
    return;
  }

  running = true;

  try {
    const accounts = await supabase
      .from('wallet_accounts')
      .select(
        'id,user_id,asset,network,chain_family,deposit_address,status',
      )
      .eq('chain_family', 'bitcoin')
      .eq('asset', 'BTC')
      .eq('network', 'bitcoin')
      .eq('status', 'active')
      .not('deposit_address', 'is', null)
      .limit(MAX_ACCOUNTS);

    if (accounts.error) throw new Error(accounts.error.message);

    for (const account of accounts.data || []) {
      try {
        await scanAccount(account);
      } catch (error) {
        console.error(
          `[bitcoin] account=${account.id} scan failed:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  } catch (error) {
    console.error(
      '[bitcoin] monitor cycle failed:',
      error instanceof Error ? error.message : error,
    );
  } finally {
    running = false;
  }
}

if (process.env.BITCOIN_MONITOR_ENABLED === 'true') {
  try {
    validateConfig();

    console.log(
      `[bitcoin] deposit monitor enabled; interval=${INTERVAL_MS}ms maxAccounts=${MAX_ACCOUNTS} requiredConfirmations=${confirmationsRequired()}`,
    );

    void runBitcoinMonitorCycle();
    setInterval(() => void runBitcoinMonitorCycle(), INTERVAL_MS);
  } catch (error) {
    console.error(
      '[bitcoin] deposit monitor disabled:',
      error instanceof Error ? error.message : error,
    );
  }
} else {
  console.log(
    '[bitcoin] deposit monitor disabled (BITCOIN_MONITOR_ENABLED is not true).',
  );
}
