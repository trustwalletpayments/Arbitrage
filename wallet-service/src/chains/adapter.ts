import type { CustodyChainDefinition } from './chain-registry.js';

export type ProvisionedChainAddress = {
  chain: string;
  family: string;
  asset: string;
  address: string;
  derivationPath: string;
  derivationIndex: number;
};

export type ChainAdapter = {
  definition: CustodyChainDefinition;
  isConfigured(): boolean;
  deriveAddress(index: number): Promise<ProvisionedChainAddress>;
  scanDeposits(address: string, fromCursor?: string): Promise<unknown[]>;
  sweep(account: ProvisionedChainAddress): Promise<{ txHash: string; amount: string; fee: string }>;
};

/**
 * Adapters are deliberately kept behind this contract so every new chain can
 * plug into the existing Orbitex account/credit/sweep pipeline without
 * changing the already-closed EVM implementation.
 */
export function requireConfigured(adapter: ChainAdapter): void {
  if (!adapter.isConfigured()) {
    throw new Error(`${adapter.definition.name} custody adapter is not configured.`);
  }
}
