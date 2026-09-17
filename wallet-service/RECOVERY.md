# Orbitex wallet recovery

## Required offline backups

Keep an encrypted offline backup of the EVM account-level private extended key used by the service (`EVM_XPRIV`). Never commit it to GitHub or put it in source code.

Keep a database backup/export containing, at minimum, `wallet_accounts.id`, `user_id`, `asset`, `network`, `deposit_address`, `derivation_index`, `chain_family`, `status`, `created_at`, and `updated_at`.

Also preserve the exact EVM derivation convention used by the service: account node `m/44'/60'/0'`, then external branch/index `0/<derivation_index>`.

## Recovery check

After restoring the service and database, run:

`npm run recovery -- <derivation-index>`

The command deterministically derives the address, checks BSC BNB/USDT balances, compares the derived address with the stored `wallet_accounts` mapping, and records a recovery check in `wallet_recovery_checks`. It does not move funds.

To check all stored BSC USDT accounts:

`npm run recovery`

## Operational safety

Do not enable live sweeping until the restored service passes address-match checks and a controlled test has been completed. Keep treasury credentials separate from the recovery backup and never store seed phrases/private keys in the repository.
