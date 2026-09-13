"use client";

import Link from "next/link";
import { ArrowLeft, ArrowDownToLine, Check, Copy, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import MobileNav from "../../components/MobileNav";
import "../wallet.css";
import "./deposit.css";

type Asset = { symbol: string; name: string; color: string };
type Network = { id: string; name: string; short: string; logo: string };

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

const NETWORKS: Record<string, Network[]> = {
  USDT: [
    { id: "bsc", name: "BNB Smart Chain", short: "BEP-20", logo: "bnb" },
    { id: "eth", name: "Ethereum", short: "ERC-20", logo: "eth" },
    { id: "tron", name: "Tron", short: "TRC-20", logo: "trx" },
    { id: "aptos", name: "Aptos", short: "Aptos", logo: "apt" },
    { id: "solana", name: "Solana", short: "Solana", logo: "sol" },
    { id: "arbitrum", name: "Arbitrum One", short: "Arbitrum", logo: "arb" },
    { id: "ton", name: "TON", short: "TON", logo: "ton" },
    { id: "optimism", name: "Optimism", short: "OP", logo: "op" },
    { id: "near", name: "NEAR Protocol", short: "NEAR", logo: "near" },
    { id: "polygon", name: "Polygon", short: "Polygon", logo: "pol" },
    { id: "avalanche", name: "Avalanche C-Chain", short: "AVAX", logo: "avax" },
    { id: "sui", name: "Sui", short: "Sui", logo: "sui" },
    { id: "base", name: "Base", short: "Base", logo: "base" },
    { id: "linea", name: "Linea", short: "Linea", logo: "linea" },
    { id: "fantom", name: "Fantom", short: "Fantom", logo: "ftm" },
    { id: "celo", name: "Celo", short: "Celo", logo: "celo" },
    { id: "mantle", name: "Mantle", short: "Mantle", logo: "mnt" },
    { id: "zksync", name: "zkSync Era", short: "zkSync", logo: "zksync" },
  ],
  BTC: [{ id: "bitcoin", name: "Bitcoin Network", short: "BTC", logo: "btc" }],
  ETH: [
    { id: "eth", name: "Ethereum", short: "ERC-20", logo: "eth" },
    { id: "bsc", name: "BNB Smart Chain", short: "BEP-20", logo: "bnb" },
    { id: "arbitrum", name: "Arbitrum One", short: "Arbitrum", logo: "arb" },
    { id: "optimism", name: "Optimism", short: "OP", logo: "op" },
    { id: "base", name: "Base", short: "Base", logo: "base" },
    { id: "polygon", name: "Polygon", short: "Polygon", logo: "pol" },
    { id: "linea", name: "Linea", short: "Linea", logo: "linea" },
    { id: "avalanche", name: "Avalanche C-Chain", short: "AVAX", logo: "avax" },
    { id: "zksync", name: "zkSync Era", short: "zkSync", logo: "zksync" },
  ],
  BNB: [{ id: "bsc", name: "BNB Smart Chain", short: "BEP-20", logo: "bnb" }],
  SOL: [{ id: "solana", name: "Solana", short: "Solana", logo: "sol" }],
  XRP: [{ id: "xrp", name: "XRP Ledger", short: "XRP", logo: "xrp" }],
  USDC: [
    { id: "eth", name: "Ethereum", short: "ERC-20", logo: "eth" },
    { id: "bsc", name: "BNB Smart Chain", short: "BEP-20", logo: "bnb" },
    { id: "solana", name: "Solana", short: "Solana", logo: "sol" },
    { id: "arbitrum", name: "Arbitrum One", short: "Arbitrum", logo: "arb" },
    { id: "base", name: "Base", short: "Base", logo: "base" },
    { id: "polygon", name: "Polygon", short: "Polygon", logo: "pol" },
    { id: "optimism", name: "Optimism", short: "OP", logo: "op" },
    { id: "avalanche", name: "Avalanche C-Chain", short: "AVAX", logo: "avax" },
  ],
  ADA: [{ id: "cardano", name: "Cardano", short: "Cardano", logo: "ada" }],
  DOGE: [{ id: "dogecoin", name: "Dogecoin", short: "DOGE", logo: "doge" }],
  TRX: [{ id: "tron", name: "Tron", short: "TRC-20", logo: "trx" }],
  AVAX: [{ id: "avalanche", name: "Avalanche C-Chain", short: "AVAX", logo: "avax" }],
  LINK: [
    { id: "eth", name: "Ethereum", short: "ERC-20", logo: "eth" },
    { id: "bsc", name: "BNB Smart Chain", short: "BEP-20", logo: "bnb" },
    { id: "arbitrum", name: "Arbitrum One", short: "Arbitrum", logo: "arb" },
    { id: "polygon", name: "Polygon", short: "Polygon", logo: "pol" },
    { id: "optimism", name: "Optimism", short: "OP", logo: "op" },
    { id: "base", name: "Base", short: "Base", logo: "base" },
    { id: "avalanche", name: "Avalanche C-Chain", short: "AVAX", logo: "avax" },
  ],
  DOT: [{ id: "polkadot", name: "Polkadot", short: "DOT", logo: "dot" }],
  POL: [
    { id: "polygon", name: "Polygon", short: "Polygon", logo: "pol" },
    { id: "eth", name: "Ethereum", short: "ERC-20", logo: "eth" },
    { id: "bsc", name: "BNB Smart Chain", short: "BEP-20", logo: "bnb" },
  ],
  LTC: [{ id: "litecoin", name: "Litecoin", short: "LTC", logo: "ltc" }],
  SHIB: [
    { id: "eth", name: "Ethereum", short: "ERC-20", logo: "eth" },
    { id: "bsc", name: "BNB Smart Chain", short: "BEP-20", logo: "bnb" },
    { id: "arbitrum", name: "Arbitrum One", short: "Arbitrum", logo: "arb" },
    { id: "polygon", name: "Polygon", short: "Polygon", logo: "pol" },
  ],
  UNI: [
    { id: "eth", name: "Ethereum", short: "ERC-20", logo: "eth" },
    { id: "bsc", name: "BNB Smart Chain", short: "BEP-20", logo: "bnb" },
    { id: "arbitrum", name: "Arbitrum One", short: "Arbitrum", logo: "arb" },
    { id: "polygon", name: "Polygon", short: "Polygon", logo: "pol" },
    { id: "optimism", name: "Optimism", short: "OP", logo: "op" },
    { id: "base", name: "Base", short: "Base", logo: "base" },
  ],
  BCH: [{ id: "bitcoincash", name: "Bitcoin Cash", short: "BCH", logo: "bch" }],
  ATOM: [{ id: "cosmos", name: "Cosmos Hub", short: "ATOM", logo: "atom" }],
  XLM: [{ id: "stellar", name: "Stellar", short: "XLM", logo: "xlm" }],
};

const DEMO_ADDRESSES: Record<string, string> = {
  bsc: "0xORBITEX-DEMO-BEP20-ADDRESS",
  eth: "0xORBITEX-DEMO-ERC20-ADDRESS",
  tron: "TORBITEXDEMO-TRC20-ADDRESS",
  aptos: "0xORBITEX-DEMO-APTOS-ADDRESS",
  solana: "ORBITEX-DEMO-SOLANA-ADDRESS",
  arbitrum: "0xORBITEX-DEMO-ARBITRUM-ADDRESS",
  ton: "EQORBITEXDEMO-TON-ADDRESS",
  optimism: "0xORBITEX-DEMO-OPTIMISM-ADDRESS",
  near: "orbitex-demo.near",
  polygon: "0xORBITEX-DEMO-POLYGON-ADDRESS",
  avalanche: "0xORBITEX-DEMO-AVAX-ADDRESS",
  sui: "0xORBITEX-DEMO-SUI-ADDRESS",
  base: "0xORBITEX-DEMO-BASE-ADDRESS",
  bitcoin: "bc1qorbitexdemobitcoinaddress",
  linea: "0xORBITEX-DEMO-LINEA-ADDRESS",
  xrp: "rORBITEXDemoXrpAddress",
  cardano: "addr1orbitexdemocardanoaddress",
  dogecoin: "DORBITEXDemoDogecoinAddress",
  polkadot: "1ORBITEXDemoPolkadotAddress",
  litecoin: "ltc1orbitexdemolitecoinaddress",
  bitcoincash: "bitcoincash:qorbitexdemoaddress",
  cosmos: "cosmos1orbitexdemoaddress",
  stellar: "GORBITEXDEMOSTELLARADDRESS",
};

function AssetLogo({ asset }: { asset: Asset }) {
  return <span className="deposit-asset-logo" style={{ background: asset.color }}><img src={`https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`} alt={`${asset.name} logo`} /></span>;
}

function NetworkLogo({ network }: { network: Network }) {
  return <span className="deposit-network-logo"><img src={`https://assets.coincap.io/assets/icons/${network.logo}@2x.png`} alt={`${network.name} logo`} /><span>{network.short.slice(0, 2)}</span></span>;
}

export default function DepositPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Asset>(ASSETS[0]);
  const [networkId, setNetworkId] = useState("bsc");
  const [copied, setCopied] = useState(false);
  const filteredAssets = useMemo(() => { const value = query.trim().toLowerCase(); return value ? ASSETS.filter((asset) => `${asset.symbol} ${asset.name}`.toLowerCase().includes(value)) : ASSETS; }, [query]);
  const selectedNetworks = NETWORKS[selected.symbol] ?? [];
  const selectedNetwork = selectedNetworks.find((item) => item.id === networkId) ?? selectedNetworks[0];
  const depositAddress = DEMO_ADDRESSES[selectedNetwork?.id ?? ""] ?? "ORBITEX-DEMO-DEPOSIT-ADDRESS";
  function selectAsset(asset: Asset) { setSelected(asset); setNetworkId(NETWORKS[asset.symbol]?.[0]?.id ?? ""); setCopied(false); }
  async function copyAddress() { try { await navigator.clipboard.writeText(depositAddress); } catch {} setCopied(true); window.setTimeout(() => setCopied(false), 1800); }

  return <main className="wallet-page">
    <header className="wallet-header"><Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link><Link href="/wallet" className="history-link"><ArrowLeft size={18} /> Back to Wallet</Link></header>
    <div className="wallet-content deposit-content"><div className="wallet-heading"><div><span className="wallet-kicker">FUND YOUR ACCOUNT</span><h1>Deposit</h1><p>Choose a crypto and the network you want to use for your deposit.</p></div></div>
      <section className="deposit-shell"><div className="deposit-selector"><div className="deposit-section-heading"><div><span className="wallet-kicker">SELECT ASSET</span><h2>Choose a deposit asset</h2></div><span className="supported-count">20 supported assets</span></div><label className="deposit-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by coin name or symbol" /></label><div className="deposit-asset-grid">{filteredAssets.map((asset) => <button key={asset.symbol} type="button" className={`deposit-asset-option ${selected.symbol === asset.symbol ? "selected" : ""}`} onClick={() => selectAsset(asset)}><AssetLogo asset={asset} /><span><strong>{asset.symbol}</strong><small>{asset.name}</small></span>{selected.symbol === asset.symbol && <Check size={17} className="asset-selected-check" />}</button>)}</div>{filteredAssets.length === 0 && <div className="deposit-no-results">No supported asset matches your search.</div>}</div>
        <div className="deposit-details"><div className="selected-asset-heading"><AssetLogo asset={selected} /><div><span className="wallet-kicker">DEPOSIT ASSET</span><h2>{selected.name} <em>{selected.symbol}</em></h2></div></div><p className="deposit-helper">Select the network that matches the wallet or exchange you are sending from. Sending through the wrong network can permanently lose funds.</p><label className="deposit-field-label">Choose network</label><div className="deposit-network-list">{selectedNetworks.map((item) => <button key={item.id} type="button" className={`deposit-network-option ${selectedNetwork?.id === item.id ? "selected" : ""}`} onClick={() => { setNetworkId(item.id); setCopied(false); }}><NetworkLogo network={item} /><span><strong>{item.name}</strong><small>{item.short}</small></span>{selectedNetwork?.id === item.id && <Check size={17} className="asset-selected-check" />}</button>)}</div><div className="deposit-address-box"><span>{selectedNetwork?.name} deposit address</span><strong>{depositAddress}</strong><button type="button" onClick={copyAddress}><Copy size={17} /> {copied ? "Copied" : "Copy address"}</button></div><button className="primary-action deposit-continue" type="button"><ArrowDownToLine size={18} /> Deposit {selected.symbol}</button><div className="deposit-security-note"><ShieldCheck size={18} /><span><strong>Demo mode</strong> This address is for interface testing only. Live deposit addresses will be connected after the exchange wallet infrastructure is enabled.</span></div></div>
      </section></div><MobileNav /></main>;
}
