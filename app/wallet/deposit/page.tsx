"use client";

import Link from "next/link";
import { ArrowLeft, ArrowDownToLine, Check, Copy, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import MobileNav from "../../components/MobileNav";
import "../wallet.css";
import "./deposit.css";

type Asset = { symbol: string; name: string; color: string };

const ASSETS: Asset[] = [
  { symbol: "USDT", name: "Tether", color: "#26a17b" },
  { symbol: "BTC", name: "Bitcoin", color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", color: "#627eea" },
  { symbol: "BNB", name: "BNB", color: "#f3ba2f" },
  { symbol: "SOL", name: "Solana", color: "#8b5cf6" },
  { symbol: "XRP", name: "XRP", color: "#64748b" },
  { symbol: "USDC", name: "USD Coin", color: "#2775ca" },
  { symbol: "ADA", name: "Cardano", color: "#2563eb" },
  { symbol: "DOGE", name: "Dogecoin", color: "#c2a633" },
  { symbol: "TRX", name: "TRON", color: "#ef4444" },
  { symbol: "AVAX", name: "Avalanche", color: "#e84142" },
  { symbol: "LINK", name: "Chainlink", color: "#2a5ada" },
  { symbol: "DOT", name: "Polkadot", color: "#e6007a" },
  { symbol: "POL", name: "Polygon", color: "#8247e5" },
  { symbol: "LTC", name: "Litecoin", color: "#345d9d" },
  { symbol: "SHIB", name: "Shiba Inu", color: "#f28c28" },
  { symbol: "UNI", name: "Uniswap", color: "#ff007a" },
  { symbol: "BCH", name: "Bitcoin Cash", color: "#0ac18e" },
  { symbol: "ATOM", name: "Cosmos", color: "#6f7390" },
  { symbol: "XLM", name: "Stellar", color: "#8b93a7" },
];

const NETWORKS: Record<string, string[]> = {
  USDT: ["BNB Smart Chain (BEP-20)", "Ethereum (ERC-20)", "Tron (TRC-20)"],
  USDC: ["Ethereum (ERC-20)", "BNB Smart Chain (BEP-20)", "Solana"],
  BTC: ["Bitcoin"],
  ETH: ["Ethereum (ERC-20)"],
  BNB: ["BNB Smart Chain (BEP-20)"],
  SOL: ["Solana"],
  XRP: ["XRP Ledger"],
  ADA: ["Cardano"],
  DOGE: ["Dogecoin"],
  TRX: ["Tron (TRC-20)"],
  AVAX: ["Avalanche C-Chain"],
  LINK: ["Ethereum (ERC-20)"],
  DOT: ["Polkadot"],
  POL: ["Polygon"],
  LTC: ["Litecoin"],
  SHIB: ["Ethereum (ERC-20)"],
  UNI: ["Ethereum (ERC-20)"],
  BCH: ["Bitcoin Cash"],
  ATOM: ["Cosmos"],
  XLM: ["Stellar"],
};

const DEMO_ADDRESSES: Record<string, string> = {
  "BNB Smart Chain (BEP-20)": "0xORBITEX-DEMO-BEP20-ADDRESS",
  "Ethereum (ERC-20)": "0xORBITEX-DEMO-ERC20-ADDRESS",
  "Tron (TRC-20)": "T ORBITEX-DEMO-TRC20-ADDRESS".replace(" ", ""),
  Bitcoin: "bc1qorbitexdemobitcoinaddress",
  Solana: "ORBITEX-DEMO-SOLANA-ADDRESS",
  "XRP Ledger": "rORBITEXDemoXrpAddress",
  Cardano: "addr1orbitexdemocardanoaddress",
  Dogecoin: "DORBITEXDemoDogecoinAddress",
  "Avalanche C-Chain": "0xORBITEX-DEMO-AVAX-ADDRESS",
  Polygon: "0xORBITEX-DEMO-POLYGON-ADDRESS",
  Polkadot: "1ORBITEXDemoPolkadotAddress",
  Litecoin: "ltc1orbitexdemolitecoinaddress",
  "Bitcoin Cash": "bitcoincash:qorbitexdemoaddress",
  Cosmos: "cosmos1orbitexdemocosmosaddress",
  Stellar: "GORBITEXDEMOSTELLARADDRESS",
};

function AssetLogo({ asset }: { asset: Asset }) {
  return (
    <span className="deposit-asset-logo" style={{ background: asset.color }}>
      <img src={`https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`} alt={`${asset.name} logo`} />
    </span>
  );
}

export default function DepositPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Asset>(ASSETS[0]);
  const [network, setNetwork] = useState(NETWORKS.USDT[0]);
  const [copied, setCopied] = useState(false);

  const filteredAssets = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return ASSETS;
    return ASSETS.filter((asset) => `${asset.symbol} ${asset.name}`.toLowerCase().includes(value));
  }, [query]);

  const selectedNetworks = NETWORKS[selected.symbol] ?? ["Network unavailable"];
  const depositAddress = DEMO_ADDRESSES[network] ?? "ORBITEX-DEMO-DEPOSIT-ADDRESS";

  function selectAsset(asset: Asset) {
    setSelected(asset);
    setNetwork(NETWORKS[asset.symbol]?.[0] ?? "Network unavailable");
    setCopied(false);
  }

  async function copyAddress() {
    try { await navigator.clipboard.writeText(depositAddress); } catch {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

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
            <p>Choose a supported asset and network to add funds to your Orbitex wallet.</p>
          </div>
        </div>

        <section className="deposit-shell">
          <div className="deposit-selector">
            <div className="deposit-section-heading">
              <div><span className="wallet-kicker">SELECT ASSET</span><h2>Choose a deposit asset</h2></div>
              <span className="supported-count">20 supported assets</span>
            </div>
            <label className="deposit-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by coin name or symbol" /></label>
            <div className="deposit-asset-grid">
              {filteredAssets.map((asset) => (
                <button key={asset.symbol} type="button" className={`deposit-asset-option ${selected.symbol === asset.symbol ? "selected" : ""}`} onClick={() => selectAsset(asset)}>
                  <AssetLogo asset={asset} />
                  <span><strong>{asset.symbol}</strong><small>{asset.name}</small></span>
                  {selected.symbol === asset.symbol && <Check size={17} className="asset-selected-check" />}
                </button>
              ))}
            </div>
            {filteredAssets.length === 0 && <div className="deposit-no-results">No supported asset matches your search.</div>}
          </div>

          <div className="deposit-details">
            <div className="selected-asset-heading"><AssetLogo asset={selected} /><div><span className="wallet-kicker">DEPOSIT ASSET</span><h2>{selected.name} <em>{selected.symbol}</em></h2></div></div>
            <p className="deposit-helper">Select the correct network before sending funds. Depositing through an unsupported network may permanently lose your funds.</p>
            <label className="deposit-field-label" htmlFor="deposit-network">Network</label>
            <select id="deposit-network" value={network} onChange={(event) => setNetwork(event.target.value)} className="deposit-network-select">
              {selectedNetworks.map((item) => <option key={item}>{item}</option>)}
            </select>
            <div className="deposit-address-box"><span>Demo deposit address</span><strong>{depositAddress}</strong><button type="button" onClick={copyAddress}><Copy size={17} /> {copied ? "Copied" : "Copy address"}</button></div>
            <button className="primary-action deposit-continue" type="button"><ArrowDownToLine size={18} /> Deposit {selected.symbol}</button>
            <div className="deposit-security-note"><ShieldCheck size={18} /><span><strong>Demo mode</strong> This address is for interface testing only. Do not send real funds until live deposit infrastructure is enabled.</span></div>
          </div>
        </section>
      </div>
      <MobileNav />
    </main>
  );
}
