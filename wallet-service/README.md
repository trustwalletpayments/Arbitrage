# Orbitex self-hosted wallet service

This service provisions unique USDT BEP-20 deposit addresses from an extended public key (xpub). It does not contain private keys and does not process withdrawals yet.

## Setup

1. Create a dedicated wallet offline.
2. Export an account-level or dedicated deposit-chain xpub. Never put a seed phrase or private key in this repository.
3. Deploy this `wallet-service` directory to a private VPS or Railway service using the included `Dockerfile` and `railway.toml`.
4. Configure the environment variables in the hosting provider's secret/environment settings. Do not commit a `.env` file.
5. Run locally with:

```bash
npm install
npm run dev
```

## Required environment variables

- `PORT` — normally `8080`
- `SUPABASE_URL` — Orbitex Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — server-only Supabase service-role key
- `WALLET_XPUB` — public derivation key used to generate deposit addresses
- `ADMIN_API_KEY` — long random secret used to authorize provisioning requests
- `BSC_RPC_URL` — BNB Smart Chain RPC endpoint for the future monitoring worker
- `USDT_CONTRACT` — BEP-20 USDT contract address
- `CONFIRMATIONS_REQUIRED` — confirmation threshold for deposit crediting

## Provision an address

```bash
curl -X POST https://YOUR_WALLET_SERVICE_DOMAIN/provision/USER_UUID \
  -H 'x-wallet-service-key: YOUR_ADMIN_API_KEY'
```

The service writes the address into `public.wallet_accounts`. The website then reads it through Supabase RLS.

## Health check

```bash
curl https://YOUR_WALLET_SERVICE_DOMAIN/health
```

The response should report `ok: true`, the `BEP20` network, and the `USDT` asset.

## Production requirements before accepting real funds

- Put the service behind HTTPS and a firewall.
- Restrict the provisioning endpoint to the Orbitex backend or private network.
- Use the transaction-safe `allocate_wallet_derivation_index()` RPC function; never allocate indexes by counting wallet rows.
- Add blockchain monitoring and confirmation logic before crediting deposits.
- Test address derivation and deposit detection on a test wallet before using real funds.
- Keep withdrawal signing in a separate hardened service or offline approval flow.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, xpub, seed phrase, or private keys to the browser.
- Do not treat a detected transaction as a credited balance until the required confirmations are reached.
