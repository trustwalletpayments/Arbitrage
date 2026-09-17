import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { HDNodeWallet, getAddress } from 'ethers';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'WALLET_XPUB', 'ADMIN_API_KEY'];
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

const root = HDNodeWallet.fromExtendedKey(process.env.WALLET_XPUB!);
const apiKey = process.env.ADMIN_API_KEY!;
const port = Number(process.env.PORT || 8080);

function authorized(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.header('x-wallet-service-key') !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function deriveAddress(index: number): string {
  return getAddress(root.deriveChild(index).address);
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'orbitex-wallet-service', network: 'BEP20', asset: 'USDT' });
});

app.post('/provision/:userId', authorized, async (req, res) => {
  const userId = req.params.userId;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  const existing = await supabase
    .from('wallet_accounts')
    .select('id,user_id,deposit_address,status')
    .eq('user_id', userId)
    .eq('asset', 'USDT')
    .eq('network', 'BEP20')
    .maybeSingle();

  if (existing.error) return res.status(500).json({ error: existing.error.message });
  if (existing.data?.deposit_address) return res.json({ wallet: existing.data, created: false });

  const countResult = await supabase
    .from('wallet_accounts')
    .select('id', { count: 'exact', head: true });

  if (countResult.error) return res.status(500).json({ error: countResult.error.message });
  const derivationIndex = countResult.count ?? 0;
  const address = deriveAddress(derivationIndex);

  const inserted = await supabase
    .from('wallet_accounts')
    .insert({
      user_id: userId,
      asset: 'USDT',
      network: 'BEP20',
      deposit_address: address,
      status: 'active'
    })
    .select('id,user_id,asset,network,deposit_address,status,created_at')
    .single();

  if (inserted.error) return res.status(500).json({ error: inserted.error.message });
  return res.status(201).json({ wallet: inserted.data, created: true });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Orbitex wallet service listening on port ${port}`);
});
