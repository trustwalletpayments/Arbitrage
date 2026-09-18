"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MobileNav from "../../components/MobileNav";
import "../wallet.css";
import "./deposit.css";

type Asset = {
  symbol: string;
  name: string;
  color: string;
};

type Network = {
  id: string;
  name: string;
  short: string;
  logo: string;
};

const ASSETS: Asset[] = [
  { symbol: "USDT", name: "Tether", color: "#26a17b" },
  { symbol: "USDC", name: "USD Coin", color: "#2775ca" },
  { symbol: "ETH", name: "Ethereum", color: "#627eea" },
  { symbol: "BTC", name: "Bitcoin", color: "#f7931a" },
  { symbol: "BNB", name: "BNB", color: "#f3ba2f" },
  { symbol: "SOL", name: "Solana", color: "#111111" },
  { symbol: "XRP", name: "XRP", color: "#23292f" },
  { symbol: "TRX", name: "TRON", color: "#ef0027" },
  { symbol: "ADA", name: "Cardano", color: "#0033ad" },
  { symbol: "AVAX", name: "Avalanche", color: "#e84142" },
  { symbol: "DOT", name: "Polkadot", color: "#e6007a" },
  { symbol: "LINK", name: "Chainlink", color: "#2a5ada" },
  { symbol: "LTC", name: "Litecoin", color: "#345d9d" },
  { symbol: "DOGE", name: "Dogecoin", color: "#c2a633" },
  { symbol: "POL", name: "Polygon", color: "#8247e5" },
  { symbol: "UNI", name: "Uniswap", color: "#ff007a" },
  { symbol: "ATOM", name: "Cosmos", color: "#2e3148" },
  { symbol: "NEAR", name: "NEAR Protocol", color: "#111111" },
  { symbol: "APT", name: "Aptos", color: "#111111" },
  { symbol: "SUI", name: "Sui", color: "#6fbcf0" },
  { symbol: "TON", name: "Toncoin", color: "#0098ea" },
  { symbol: "XLM", name: "Stellar", color: "#000000" },
  { symbol: "BCH", name: "Bitcoin Cash", color: "#0ac18e" },
  { symbol: "ARB", name: "Arbitrum", color: "#28a0f0" },
];

const NETWORKS: Network[] = [
  { id: "ethereum", name: "Ethereum", short: "ERC-20", logo: "ETH" },
  { id: "bsc", name: "BNB Smart Chain", short: "BEP-20", logo: "BNB" },
  { id: "polygon", name: "Polygon", short: "Polygon", logo: "POL" },
  { id: "arbitrum", name: "Arbitrum One", short: "Arbitrum", logo: "ARB" },
  { id: "optimism", name: "Optimism", short: "Optimism", logo: "OP" },
  { id: "base", name: "Base", short: "Base", logo: "BASE" },
  { id: "avalanche", name: "Avalanche C-Chain", short: "C-Chain", logo: "AVAX" },
  { id: "fantom", name: "Fantom", short: "Fantom", logo: "FTM" },
  { id: "cronos", name: "Cronos", short: "Cronos", logo: "CRO" },
  { id: "linea", name: "Linea", short: "Linea", logo: "LINEA" },
];

// Only combinations that currently have an end-to-end backend adapter are enabled.
// The rest are displayed in the selector but deliberately cannot be selected yet,
// so users are never given a deposit address that the backend cannot monitor/sweep.
const ENABLED_DEPOSITS = new Set(["USDT:bsc"]);

function Logo({ asset, network }: { asset?: Asset; network?: Network }) {
  const symbol = asset?.symbol ?? network?.logo ?? "";
  const color = asset?.color ?? "#18324d";
  return (
    <span className="deposit-asset-logo" style={{ background: color }}>
      <span>{symbol.slice(0, 2)}</span>
    </span>
  );
}

export default function DepositPage() {
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState<Asset>(ASSETS[0]);
  const [showNetworks, setShowNetworks] = useState(false);
  const [search, setSearch] = useState("");

  const filteredAssets = useMemo(
    () => ASSETS.filter((asset) => `${asset.symbol} ${asset.name}`.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const chooseAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowNetworks(true);
  };

  const chooseNetwork = (network: Network) => {
    if (!ENABLED_DEPOSITS.has(`${selectedAsset.symbol}:${network.id}`)) return;
    router.push(
      `/wallet/deposit/address?asset=${selectedAsset.symbol}&assetName=${encodeURIComponent(selectedAsset.name)}&network=${encodeURIComponent(network.name)}&networkShort=${encodeURIComponent(network.short)}&networkId=${network.id}`
    );
  };

  return (
    <main className="wallet-page">
      <header className="wallet-header">
        <Link href="/wallet" className="wallet-brand">
          <span className="brand-mark">◉</span> ORBITEX
        </Link>
        <Link href="/wallet" className="history-link"><ArrowLeft size={18} /> Back to Wallet</Link>
      </header>

      <div className="wallet-content deposit-content">
        <div className="wallet-heading">
          <div>
            <span className="wallet-kicker">FUND YOUR ACCOUNT</span>
            <h1>Deposit</h1>
            <p>{showNetworks ? `Choose a network for ${selectedAsset.symbol}.` : "Select the asset you want to deposit."}</p>
          </div>
        </div>

        <section className="deposit-shell">
          <div className={`deposit-selector withdraw-assets ${showNetworks ? "mobile-hidden" : ""}`}>
            <div className="deposit-section-heading">
              <div>
                <span className="wallet-kicker">SELECT ASSET</span>
                <h2>Choose a deposit asset</h2>
              </div>
              <span className="supported-count">{ASSETS.length} assets</span>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search asset..."
              aria-label="Search deposit assets"
              style={{ width: "100%", marginBottom: 14 }}
            />

            <div className="deposit-asset-grid">
              {filteredAssets.map((asset) => {
                const enabled = asset.symbol === "USDT";
                return (
                  <button
                    key={asset.symbol}
                    type="button"
                    className={`deposit-asset-option ${selectedAsset.symbol === asset.symbol ? "selected" : ""}`}
                    onClick={() => chooseAsset(asset)}
                  >
                    <Logo asset={asset} />
                    <span><strong>{asset.symbol}</strong><small>{asset.name}</small></span>
                    {enabled ? <Check size={17} className="asset-selected-check" /> : <ChevronRight size={17} />}
                  </button>
                );
              })}
            </div>

            <p className="deposit-helper">
              24 assets are prepared in the deposit selector. Deposit routes are enabled only after their chain adapter, verification, and recovery/sweep path are ready.
            </p>
          </div>

          <div className={`deposit-details withdraw-form ${showNetworks ? "mobile-visible" : "mobile-hidden"}`}>
            <button type="button" className="mobile-back-button" onClick={() => setShowNetworks(false)}>
              <ArrowLeft size={17} /> Choose another asset
            </button>

            <div className="selected-asset-heading">
              <Logo asset={selectedAsset} />
              <div>
                <span className="wallet-kicker">DEPOSIT ASSET</span>
                <h2>{selectedAsset.name} <em>{selectedAsset.symbol}</em></h2>
              </div>
            </div>

            <p className="deposit-helper">
              Select the network matching the asset you are sending. Never send funds over a different network than the one shown on the receiving address.
            </p>

            <div className="deposit-network-step">
              <label className="deposit-field-label">Choose network for {selectedAsset.symbol}</label>
              <div className="deposit-network-list">
                {NETWORKS.map((network) => {
                  const enabled = ENABLED_DEPOSITS.has(`${selectedAsset.symbol}:${network.id}`);
                  return (
                    <button
                      key={network.id}
                      type="button"
                      className={`deposit-network-option ${enabled ? "selected" : ""}`}
                      onClick={() => chooseNetwork(network)}
                      disabled={!enabled}
                      title={enabled ? `Deposit ${selectedAsset.symbol} on ${network.name}` : "Coming soon — backend adapter not enabled yet"}
                      style={!enabled ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
                    >
                      <Logo network={network} />
                      <span>
                        <strong>{selectedAsset.symbol} on {network.name}</strong>
                        <small>{network.short} network{enabled ? "" : " • Coming soon"}</small>
                      </span>
                      {enabled ? <Check size={17} className="asset-selected-check" /> : <ChevronRight size={17} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
      <MobileNav />
    </main>
  );
}
