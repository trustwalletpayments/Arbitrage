/**
 * Additive multichain registry for Orbitex custody.
 *
 * IMPORTANT:
 * - This file does not alter the existing EVM/Alchemy wallet implementation.
 * - A chain is only considered operational when its signer/derivation and
 *   node configuration are explicitly present in the server environment.
 * - Never put private keys, mnemonics, or seed material in this file.
 */

export type CustodyChainFamily =
  | 'evm'
  | 'bitcoin'
  | 'solana'
  | 'tron'
  | 'xrp'
  | 'cardano'
  | 'polkadot'
  | 'cosmos'
  | 'near'
  | 'aptos'
  | 'sui'
  | 'ton'
  | 'stellar';

export type CustodyChainDefinition = {
  id: string;
  name: string;
  family: CustodyChainFamily;
  nativeAsset: string;
  rpcEnv?: string;
  explorerEnv?: string;
  masterKeyEnv?: string;
  derivationPath: string;
  status: 'adapter-pending' | 'adapter-ready';
};

/**
 * Non-EVM chains shown by the Orbitex deposit selector.  These definitions
 * are intentionally additive: the existing EVM network registry remains the
 * source of truth for EVM custody and sweeping.
 */
export const NON_EVM_CUSTODY_CHAINS: CustodyChainDefinition[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    family: 'bitcoin',
    nativeAsset: 'BTC',
    rpcEnv: 'BTC_RPC_URL',
    explorerEnv: 'BTC_EXPLORER_URL',
    masterKeyEnv: 'BTC_XPRV',
    derivationPath: "m/84'/0'/0'/0/{index}",
    status: 'adapter-pending',
  },
  {
    id: 'solana',
    name: 'Solana',
    family: 'solana',
    nativeAsset: 'SOL',
    rpcEnv: 'SOLANA_RPC_URL',
    masterKeyEnv: 'SOLANA_MNEMONIC',
    derivationPath: "m/44'/501'/{index}'/0'",
    status: 'adapter-pending',
  },
  {
    id: 'tron',
    name: 'TRON',
    family: 'tron',
    nativeAsset: 'TRX',
    rpcEnv: 'TRON_RPC_URL',
    masterKeyEnv: 'TRON_XPRV',
    derivationPath: "m/44'/195'/0'/0/{index}",
    status: 'adapter-pending',
  },
  {
    id: 'xrp',
    name: 'XRP Ledger',
    family: 'xrp',
    nativeAsset: 'XRP',
    rpcEnv: 'XRP_RPC_URL',
    masterKeyEnv: 'XRP_XPRV',
    derivationPath: "m/44'/144'/0'/0/{index}",
    status: 'adapter-pending',
  },
  {
    id: 'cardano',
    name: 'Cardano',
    family: 'cardano',
    nativeAsset: 'ADA',
    rpcEnv: 'CARDANO_RPC_URL',
    masterKeyEnv: 'CARDANO_ROOT_KEY',
    derivationPath: "m/1852'/1815'/0'/0/{index}",
    status: 'adapter-pending',
  },
  {
    id: 'polkadot',
    name: 'Polkadot',
    family: 'polkadot',
    nativeAsset: 'DOT',
    rpcEnv: 'POLKADOT_RPC_URL',
    masterKeyEnv: 'POLKADOT_ROOT_KEY',
    derivationPath: "//{index}",
    status: 'adapter-pending',
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    family: 'cosmos',
    nativeAsset: 'ATOM',
    rpcEnv: 'COSMOS_RPC_URL',
    masterKeyEnv: 'COSMOS_ROOT_KEY',
    derivationPath: "m/44'/118'/0'/0/{index}",
    status: 'adapter-pending',
  },
  {
    id: 'near',
    name: 'NEAR Protocol',
    family: 'near',
    nativeAsset: 'NEAR',
    rpcEnv: 'NEAR_RPC_URL',
    masterKeyEnv: 'NEAR_ROOT_KEY',
    derivationPath: 'account/{index}',
    status: 'adapter-pending',
  },
  {
    id: 'aptos',
    name: 'Aptos',
    family: 'aptos',
    nativeAsset: 'APT',
    rpcEnv: 'APTOS_RPC_URL',
    masterKeyEnv: 'APTOS_ROOT_KEY',
    derivationPath: "m/44'/637'/{index}'/0'/0'",
    status: 'adapter-pending',
  },
  {
    id: 'sui',
    name: 'Sui',
    family: 'sui',
    nativeAsset: 'SUI',
    rpcEnv: 'SUI_RPC_URL',
    masterKeyEnv: 'SUI_ROOT_KEY',
    derivationPath: "m/44'/784'/{index}'/0'/0'",
    status: 'adapter-pending',
  },
  {
    id: 'ton',
    name: 'TON',
    family: 'ton',
    nativeAsset: 'TON',
    rpcEnv: 'TON_RPC_URL',
    masterKeyEnv: 'TON_ROOT_KEY',
    derivationPath: 'wallet/{index}',
    status: 'adapter-pending',
  },
  {
    id: 'stellar',
    name: 'Stellar',
    family: 'stellar',
    nativeAsset: 'XLM',
    rpcEnv: 'STELLAR_RPC_URL',
    masterKeyEnv: 'STELLAR_ROOT_KEY',
    derivationPath: "m/44'/148'/0'/0/{index}",
    status: 'adapter-pending',
  },
];

export function getNonEvmChain(id: string): CustodyChainDefinition | undefined {
  return NON_EVM_CUSTODY_CHAINS.find((chain) => chain.id === id);
}
