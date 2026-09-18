"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { TokenIcon, NetworkIcon } from "@web3icons/react/dynamic";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MobileNav from "../../components/MobileNav";
import "../wallet.css";
import "./deposit.css";

type Asset = { symbol: string; name: string; color: string; icon: string };
type Network = { id: string; name: string; short: string; icon: string; assets: string[] };

const ASSETS: Asset[] = [
  { symbol: "USDT", name: "Tether", color: "#26a17b", icon: "tether" },
  { symbol: "USDC", name: "USD Coin", color: "#2775ca", icon: "usdcoin" },
  { symbol: "ETH", name: "Ethereum", color: "#627eea", icon: "ethereum" },
  { symbol: "BTC", name: "Bitcoin", color: "#f7931a", icon: "bitcoin" },
  { symbol: "BNB", name: "BNB", color: "#f3ba2f", icon: "bnbchain" },
  { symbol: "SOL", name: "Solana", color: "#111111", icon: "solana" },
  { symbol: "XRP", name: "XRP", color: "#23292f", icon: "xrp" },
  { symbol: "TRX", name: "TRON", color: "#ef0027", icon: "tron" },
  { symbol: "ADA", name: "Cardano", color: "#0033ad", icon: "cardano" },
  { symbol: "AVAX", name: "Avalanche", color: "#e84142", icon: "avalanche" },
  { symbol: "DOT", name: "Polkadot", color: "#e6007a", icon: "polkadot" },
  { symbol: "LINK", name: "Chainlink", color: "#2a5ada", icon: "chainlink" },
  { symbol: "LTC", name: "Litecoin", color: "#345d9d", icon: "litecoin" },
  { symbol: "DOGE", name: "Dogecoin", color: "#c2a633", icon: "dogecoin" },
  { symbol: "POL", name: "Polygon", color: "#8247e5", icon: "polygon" },
  { symbol: "UNI", name: "Uniswap", color: "#ff007a", icon: "uniswap" },
  { symbol: "ATOM", name: "Cosmos", color: "#2e3148", icon: "cosmos" },
  { symbol: "NEAR", name: "NEAR Protocol", color: "#111111", icon: "near" },
  { symbol: "APT", name: "Aptos", color: "#111111", icon: "aptos" },
  { symbol: "SUI", name: "Sui", color: "#6fbcf0", icon: "sui" },
  { symbol: "TON", name: "Toncoin", color: "#0098ea", icon: "ton" },
  { symbol: "XLM", name: "Stellar", color: "#000000", icon: "stellar" },
  { symbol: "BCH", name: "Bitcoin Cash", color: "#0ac18e", icon: "bitcoincash" },
  { symbol: "ARB", name: "Arbitrum", color: "#28a0f0", icon: "arbitrum" },
];

const EVM_TOKENS = ["USDT", "USDC", "ETH", "BNB", "LINK", "UNI", "POL", "ARB", "AVAX"];
const NETWORKS: Network[] = [
  { id: "ethereum", name: "Ethereum", short: "ERC-20", icon: "ethereum", assets: ["USDT", "USDC", "ETH", "LINK", "UNI"] },
  { id: "bsc", name: "BNB Smart Chain", short: "BEP-20", icon: "bnbchain", assets: EVM_TOKENS },
  { id: "polygon", name: "Polygon", short: "Polygon", icon: "polygon", assets: ["USDT", "USDC", "POL", "ETH", "LINK", "UNI"] },
  { id: "arbitrum", name: "Arbitrum One", short: "Arbitrum", icon: "arbitrum", assets: ["USDT", "USDC", "ETH", "ARB", "LINK", "UNI"] },
  { id: "optimism", name: "Optimism", short: "Optimism", icon: "optimism", assets: ["USDT", "USDC", "ETH", "LINK", "UNI"] },
  { id: "base", name: "Base", short: "Base", icon: "base", assets: ["USDT", "USDC", "ETH", "LINK", "UNI"] },
  { id: "avalanche", name: "Avalanche C-Chain", short: "C-Chain", icon: "avalanche", assets: ["USDT", "USDC", "AVAX", "LINK", "UNI"] },
  { id: "fantom", name: "Fantom", short: "Fantom", icon: "fantom", assets: ["USDT", "USDC", "ETH"] },
  { id: "cronos", name: "Cronos", short: "Cronos", icon: "cronos", assets: ["USDT", "USDC", "ETH"] },
  { id: "linea", name: "Linea", short: "Linea", icon: "linea", assets: ["USDT", "USDC", "ETH"] },
  { id: "bitcoin", name: "Bitcoin", short: "Bitcoin", icon: "bitcoin", assets: ["BTC"] },
  { id: "solana", name: "Solana", short: "Solana", icon: "solana", assets: ["SOL", "USDT", "USDC"] },
  { id: "tron", name: "TRON", short: "TRC-20", icon: "tron", assets: ["TRX", "USDT", "USDC"] },
  { id: "xrp", name: "XRP Ledger", short: "XRP", icon: "xrp", assets: ["XRP"] },
  { id: "cardano", name: "Cardano", short: "Cardano", icon: "cardano", assets: ["ADA"] },
  { id: "polkadot", name: "Polkadot", short: "Polkadot", icon: "polkadot", assets: ["DOT"] },
  { id: "litecoin", name: "Litecoin", short: "Litecoin", icon: "litecoin", assets: ["LTC"] },
  { id: "dogecoin", name: "Dogecoin", short: "Dogecoin", icon: "dogecoin", assets: ["DOGE"] },
  { id: "cosmos", name: "Cosmos Hub", short: "Cosmos", icon: "cosmos", assets: ["ATOM"] },
  { id: "near", name: "NEAR", short: "NEAR", icon: "near", assets: ["NEAR"] },
  { id: "aptos", name: "Aptos", short: "Aptos", icon: "aptos", assets: ["APT"] },
  { id: "sui", name: "Sui", short: "Sui", icon: "sui", assets: ["SUI"] },
  { id: "ton", name: "TON", short: "TON", icon: "ton", assets: ["TON"] },
  { id: "stellar", name: "Stellar", short: "Stellar", icon: "stellar", assets: ["XLM"] },
  { id: "bitcoincash", name: "Bitcoin Cash", short: "BCH", icon: "bitcoincash", assets: ["BCH"] },
];

// UI catalogue is intentionally broader than live routes. A network becomes
// clickable only after its backend provisioning, verification, and recovery /
// sweep path has been configured and tested.
const ENABLED_DEPOSITS = new Set(["USDT:bsc"]);

function Logo({ asset, network }: { asset?: Asset; network?: Network }) {
  const icon = asset?.icon ?? network?.icon ?? "";
  const label = asset?.symbol ?? network?.short ?? "";
  const color = asset?.color ?? "#18324d";

  return (
    <span className="deposit-asset-logo" style={{ background: `${color}22`, border: `1px solid ${color}55` }}>
      {asset ? (
        <TokenIcon symbol={asset.symbol.toLowerCase()} size={28} variant="branded" fallback={<span className="deposit-logo-fallback" style={{ color }}>{label.slice(0, 2)}</span>} />
      ) : (
        <NetworkIcon network={network?.id || icon} size={28} variant="branded" fallback={<span className="deposit-logo-fallback" style={{ color }}>{label.slice(0, 2)}</span>} />
      )}
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

  const availableNetworks = useMemo(
    () => NETWORKS.filter((network) => network.assets.includes(selectedAsset.symbol)),
    [selectedAsset.symbol]
  );

  const chooseAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowNetworks(true);
  };

  const chooseNetwork = (network: Network) => {
    if (!ENABLED_DEPOSITS.has(`${selectedAsset.symbol}:${network.id}`)) return;
    router.push(`/wallet/deposit/address?asset=${selectedAsset.symbol}&assetName=${encodeURIComponent(selectedAsset.name)}&network=${encodeURIComponent(network.name)}&networkShort=${encodeURIComponent(network.short)}&networkId=${network.id}`);
  };

  return (
    <main className="wallet-page">
      <header className="wallet-header">
        <Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link>
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
              <div><span className="wallet-kicker">SELECT ASSET</span><h2>Choose a deposit asset</h2></div>
              <span className="supported-count">{ASSETS.length} assets</span>
            </div>

            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search asset..." aria-label="Search deposit assets" style={{ width: "100%", marginBottom: 14 }} />

            <div className="deposit-asset-grid">
              {filteredAssets.map((asset) => {
                const enabled = NETWORKS.some((network) => network.assets.includes(asset.symbol) && ENABLED_DEPOSITS.has(`${asset.symbol}:${network.id}`));
                return (
                  <button key={asset.symbol} type="button" className={`deposit-asset-option ${selectedAsset.symbol === asset.symbol ? "selected" : ""}`} onClick={() => chooseAsset(asset)}>
                    <Logo asset={asset} />
                    <span><strong>{asset.symbol}</strong><small>{asset.name}</small></span>
                    {enabled ? <Check size={17} className="asset-selected-check" /> : <ChevronRight size={17} />}
                  </button>
                );
              })}
            </div>

            <p className="deposit-helper">{ASSETS.length} assets and {NETWORKS.length} compatible networks are listed. A route is clickable only after its backend adapter, verification, and recovery/sweep path are ready.</p>
          </div>

          <div className={`deposit-details withdraw-form ${showNetworks ? "mobile-visible" : "mobile-hidden"}`}>
            <button type="button" className="mobile-back-button" onClick={() => setShowNetworks(false)}><ArrowLeft size={17} /> Choose another asset</button>

            <div className="selected-asset-heading">
              <Logo asset={selectedAsset} />
              <div><span className="wallet-kicker">DEPOSIT ASSET</span><h2>{selectedAsset.name} <em>{selectedAsset.symbol}</em></h2></div>
            </div>

            <p className="deposit-helper">Select a compatible network matching the asset you are sending. Never send funds over a different network than the one shown on the receiving address.</p>

            <div className="deposit-network-step">
              <label className="deposit-field-label">Choose network for {selectedAsset.symbol}</label>
              <div className="deposit-network-list">
                {availableNetworks.map((network) => {
                  const enabled = ENABLED_DEPOSITS.has(`${selectedAsset.symbol}:${network.id}`);
                  return (
                    <button key={network.id} type="button" className={`deposit-network-option ${enabled ? "selected" : ""}`} onClick={() => chooseNetwork(network)} disabled={!enabled} title={enabled ? `Deposit ${selectedAsset.symbol} on ${network.name}` : "Coming soon — backend adapter not enabled yet"} style={!enabled ? { opacity: 0.55, cursor: "not-allowed" } : undefined}>
                      <Logo network={network} />
                      <span><strong>{selectedAsset.symbol} on {network.name}</strong><small>{network.short} network{enabled ? "" : " • Coming soon"}</small></span>
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
