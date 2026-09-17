# Orbitex self-hosted wallet service

This service provisions unique USDT BEP-20 deposit addresses from an extended public key (xpub). It does not contain private keys and does not process withdrawals yet.

## Setup

1. Create a dedicated wallet offline.
2. Export an account-level or dedicated deposit-chain xpub. Never put a seed phrase or private key in this repository.
3. Copy `.env.example` to `.env` on a private VPS.
4. Fill in Supabase service-role credentials, the xpub, and a long random `ADMIN_API_KEY`.
5. Run:

```bash
npm install
npm run dev
```

## Provision an address

```bash
curl -X POST http://YOUR_VPS:8080/provision/USER_UUID \
  -H 'x-wallet-service-key: YOUR_ADMIN_API_KEY'
```

The service writes the address into `public.wallet_accounts`. The website then reads it through Supabase RLS.

## Production requirements before accepting real funds

- Put the service behind HTTPS and a firewall.
- Restrict the provisioning endpoint to the Orbitex backend or private network.
- Replace the simple count-based derivation allocator with a transactional allocation table before production; concurrent requests must never reuse an index.
- Add blockchain monitoring and confirmation logic before crediting deposits.
- Keep withdrawal signing in a separate hardened service or offline approval flow.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, xpub, seed phrase, or private keys to the browser.
