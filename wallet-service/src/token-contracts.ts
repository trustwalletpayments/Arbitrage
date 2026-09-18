import { getAddress } from 'ethers';

// Public, network-specific USDT deployments. These are defaults so the
// wallet service can expose the supported EVM deposit routes without
// requiring the same public contract map to be copied into every environment.
// Base is intentionally omitted: the service should not label a third-party
// or USDT0 deployment as legacy USDT until the product explicitly supports it.
export const DEFAULT_EVM_TOKEN_CONTRACTS: Record<string, Record<string, string>> = {
  ethereum: { USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  bsc: { USDT: '0x55d398326f99059fF775485246999027B3197955' },
  polygon: { USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
  arbitrum: { USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' },
  optimism: { USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58' },
  avalanche: { USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7' },
  fantom: { USDT: '0x049d68029688eabf473097a2fc38ef61633a3c7a' },
  cronos: { USDT: '0x66e428c3f67a68878562e79A0234c1F83c208770' },
  linea: { USDT: '0xa219439258ca9da29e9cc4ce5596924745e12b93' },
};

export function getConfiguredTokenContracts(): Record<string, Record<string, string>> {
  const merged: Record<string, Record<string, string>> = Object.fromEntries(
    Object.entries(DEFAULT_EVM_TOKEN_CONTRACTS).map(([network, assets]) => [network, { ...assets }]),
  );
  const raw = process.env.EVM_TOKEN_CONTRACTS_JSON?.trim();
  if (!raw) return merged;
  const configured = JSON.parse(raw) as Record<string, Record<string, string>>;
  for (const [network, assets] of Object.entries(configured)) {
    merged[network] = { ...(merged[network] || {}), ...(assets || {}) };
  }
  for (const [network, assets] of Object.entries(merged)) {
    for (const [asset, address] of Object.entries(assets)) assets[asset] = getAddress(address);
  }
  return merged;
}

export function getConfiguredTokenContract(network: string, asset: string): string | null {
  return getConfiguredTokenContracts()[network]?.[asset] || null;
}
