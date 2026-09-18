export type EvmChainConfig = {
  network: string;
  chainId: number;
  nativeAsset: string;
  rpcEnv: string;
};

/**
 * Canonical EVM network configuration.
 * Keep this additive: existing wallet derivation, database mapping and sweep
 * code remain responsible for custody operations.
 */
export const EVM_CHAINS: Record<string, EvmChainConfig> = {
  ethereum: { network: 'ethereum', chainId: 1, nativeAsset: 'ETH', rpcEnv: 'ETHEREUM_RPC_URL' },
  bsc: { network: 'bsc', chainId: 56, nativeAsset: 'BNB', rpcEnv: 'BSC_RPC_URL' },
  polygon: { network: 'polygon', chainId: 137, nativeAsset: 'POL', rpcEnv: 'POLYGON_RPC_URL' },
  arbitrum: { network: 'arbitrum', chainId: 42161, nativeAsset: 'ETH', rpcEnv: 'ARBITRUM_RPC_URL' },
  optimism: { network: 'optimism', chainId: 10, nativeAsset: 'ETH', rpcEnv: 'OPTIMISM_RPC_URL' },
  base: { network: 'base', chainId: 8453, nativeAsset: 'ETH', rpcEnv: 'BASE_RPC_URL' },
  avalanche: { network: 'avalanche', chainId: 43114, nativeAsset: 'AVAX', rpcEnv: 'AVALANCHE_RPC_URL' },
  fantom: { network: 'fantom', chainId: 250, nativeAsset: 'FTM', rpcEnv: 'FANTOM_RPC_URL' },
  cronos: { network: 'cronos', chainId: 25, nativeAsset: 'CRO', rpcEnv: 'CRONOS_RPC_URL' },
  linea: { network: 'linea', chainId: 59144, nativeAsset: 'ETH', rpcEnv: 'LINEA_RPC_URL' },
};

export function getEvmChain(network: string): EvmChainConfig {
  const config = EVM_CHAINS[network.toLowerCase()];
  if (!config) throw new Error(`Unsupported EVM network: ${network}`);
  return config;
}
