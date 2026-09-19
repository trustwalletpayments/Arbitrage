import { getAddress } from 'ethers';

export const DEFAULT_EVM_TOKEN_CONTRACTS: Record<string, Record<string, string>> = {
  ethereum: {
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  bsc: {
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
  },
  polygon: {
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    ETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  },
  arbitrum: {
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  },
  optimism: {
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  },
  base: {
    USDT: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  avalanche: {
    USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    ETH: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAA',
  },
  fantom: {
    USDT: '0x049d68029688eabf473097a2fc38ef61633a3c7a',
    ETH: '0x74b23882a30290451A17c44f4F05243b6b58C76d',
  },
  cronos: {
    USDT: '0x66e428c3f67a68878562e79A0234c1F83c208770',
    USDC: '0x3D7F2C478aAfdB65542BCB44bCeeC05849999d2D',
    ETH: '0xe44Fd7fCb2b1581822D0c862B68222998a0c299a',
  },
  linea: {
    USDT: '0xa219439258ca9da29e9cc4ce5596924745e12b93',
    USDC: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff',
  },
};

export function getConfiguredTokenContracts(): Record<string, Record<string, string>> {
  const merged: Record<string, Record<string, string>> = Object.fromEntries(
    Object.entries(DEFAULT_EVM_TOKEN_CONTRACTS).map(([network, assets]) => [network, { ...assets }]),
  );
  const raw = process.env.EVM_TOKEN_CONTRACTS_JSON?.trim();
  if (!raw) return merged;
  try {
    const configured = JSON.parse(raw) as Record<string, Record<string, string>>;
    for (const [network, assets] of Object.entries(configured)) {
      merged[network] = { ...(merged[network] || {}), ...(assets || {}) };
    }
  } catch (error) {
    console.error('[tokens] EVM_TOKEN_CONTRACTS_JSON is invalid JSON; using built-in EVM token defaults instead.', error instanceof Error ? error.message : error);
    return merged;
  }
  try {
    for (const [network, assets] of Object.entries(merged)) {
      for (const [asset, address] of Object.entries(assets)) {
        if (!address) delete assets[asset];
        else assets[asset] = getAddress(address);
      }
    }
  } catch (error) {
    throw new Error(`Invalid EVM token contract address: ${error instanceof Error ? error.message : String(error)}`);
  }
  return merged;
}

export function getConfiguredTokenContract(network: string, asset: string): string | null {
  return getConfiguredTokenContracts()[network]?.[asset] || null;
}

export function getConfiguredEvmTokenAssets(network?: string): string[] {
  const contracts = getConfiguredTokenContracts();
  const networks = network ? [network] : Object.keys(contracts);
  return [...new Set(networks.flatMap((name) => Object.keys(contracts[name] || {})))].sort();
}
