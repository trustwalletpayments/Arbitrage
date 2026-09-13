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
  ["USDT", "Tether", "#26a17b"], ["BTC", "Bitcoin", "#f7931a"], ["ETH", "Ethereum", "#627eea"], ["BNB", "BNB", "#f3ba2f"],
  ["SOL", "Solana", "#8b5cf6"], ["XRP", "XRP", "#64748b"], ["USDC", "USD Coin", "#2775ca"], ["ADA", "Cardano", "#2563eb"],
  ["DOGE", "Dogecoin", "#c2a633"], ["TRX", "TRON", "#ef4444"], ["AVAX", "Avalanche", "#e84142"], ["LINK", "Chainlink", "#2a5ada"],
  ["DOT", "Polkadot", "#e6007a"], ["POL", "Polygon", "#8247e5"], ["LTC", "Litecoin", "#345d9d"], ["SHIB", "Shiba Inu", "#f28c28"],
  ["UNI", "Uniswap", "#ff007a"], ["BCH", "Bitcoin Cash", "#0ac18e"], ["ATOM", "Cosmos", "#6f7390"], ["XLM", "Stellar", "#8b93a7"],
].map(([symbol, name, color]) => ({ symbol, name, color }));

const network = (id: string, name: string, short: string, logo: string): Network => ({ id, name, short, logo });
const COMMON_EVM = [network("bsc", "BNB Smart Chain", "BEP-20", "bnb"), network("eth", "Ethereum", "ERC-20", "eth"), network("arbitrum", "Arbitrum One", "Arbitrum", "arb")];
const NETWORKS: Record<string, Network[]> = {
  USDT: [network("bsc", "BNB Smart Chain", "BEP-20", "bnb"), network("eth", "Ethereum", "ERC-20", "eth"), network("tron", "Tron", "TRC-20", "trx"), network("aptos", "Aptos", "Aptos", "apt"), network("solana", "Solana", "Solana", "sol"), network("arbitrum", "Arbitrum One", "Arbitrum", "arb"), network("ton", "TON", "TON", "ton"), network("optimism", "Optimism", "OP", "op"), network("near", "NEAR Protocol", "NEAR", "near"), network("polygon", "Polygon", "Polygon", "pol"), network("avalanche", "Avalanche C-Chain", "AVAX", "avax"), network("sui", "Sui", "Sui", "sui"), network("base", "Base", "Base", "base")],
  BTC: [network("bitcoin", "Bitcoin", "BTC", "btc"), ...COMMON_EVM],
  ETH: [network("eth", "Ethereum", "ERC-20", "eth"), ...COMMON_EVM.filter(n => n.id !== "eth"), network("optimism", "Optimism", "OP", "op"), network("base", "Base", "Base", "base"), network("polygon", "Polygon", "Polygon", "pol"), network("linea", "Linea", "Linea", "linea")],
  BNB: COMMON_EVM,
  SOL: [network("solana", "Solana", "Solana", "sol"), ...COMMON_EVM],
  XRP: [network("xrp", "XRP Ledger", "XRP", "xrp"), ...COMMON_EVM],
  USDC: [network("eth", "Ethereum", "ERC-20", "eth"), network("bsc", "BNB Smart Chain", "BEP-20", "bnb"), network("solana", "Solana", "Solana", "sol"), network("arbitrum", "Arbitrum One", "Arbitrum", "arb"), network("base", "Base", "Base", "base"), network("polygon", "Polygon", "Polygon", "pol"), network("optimism", "Optimism", "OP", "op")],
  ADA: [network("cardano", "Cardano", "Cardano", "ada"), ...COMMON_EVM], DOGE: [network("dogecoin", "Dogecoin", "DOGE", "doge"), ...COMMON_EVM],
  TRX: [network("tron", "Tron", "TRC-20", "trx"), ...COMMON_EVM], AVAX: [network("avalanche", "Avalanche C-Chain", "AVAX", "avax"), ...COMMON_EVM],
  LINK: [network("eth", "Ethereum", "ERC-20", "eth"), network("bsc", "BNB Smart Chain", "BEP-20", "bnb"), network("arbitrum", "Arbitrum One", "Arbitrum", "arb"), network("polygon", "Polygon", "Polygon", "pol"), network("optimism", "Optimism", "OP", "op"), network("base", "Base", "Base", "base")],
  DOT: [network("polkadot", "Polkadot", "DOT", "dot"), ...COMMON_EVM], POL: [network("polygon", "Polygon", "Polygon", "pol"), ...COMMON_EVM], LTC: [network("litecoin", "Litecoin", "LTC", "ltc"), ...COMMON_EVM],
  SHIB: [network("eth", "Ethereum", "ERC-20", "eth"), network("bsc", "BNB Smart Chain", "BEP-20", "bnb"), network("arbitrum", "Arbitrum One", "Arbitrum", "arb")],
  UNI: [network("eth", "Ethereum", "ERC-20", "eth"), network("bsc", "BNB Smart Chain", "BEP-20", "bnb"), network("arbitrum", "Arbitrum One", "Arbitrum", "arb"), network("polygon", "Polygon", "Polygon", "pol"), network("optimism", "Optimism", "OP", "op"), network("base", "Base", "Base", "base")],
  BCH: [network("bitcoincash", "Bitcoin Cash", "BCH", "bch"), ...COMMON_EVM], ATOM: [network("cosmos", "Cosmos Hub", "ATOM", "atom"), ...COMMON_EVM], XLM: [network("stellar", "Stellar", "XLM", "xlm"), ...COMMON_EVM],
};

const DEMO_ADDRESSES: Record<string, string> = {
  bsc: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83", eth: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83", arbitrum: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83", optimism: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83", polygon: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83", avalanche: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83", base: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83", linea: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83", tron: "TKqK2iAEKFC7M5RA12gBdskBLGNdtrTH3q", bitcoin: "bc1q3nu0hklvvnkzfsd6e8g8e29kzd8q9k6mw4ssk2", solana: "79z3yH2t7BcWdSJYx1V9CftpwEDjXS6JryVPTMtLPQJF", aptos: "0x78faf651ee5fab278b1e93e2117bff92bedc182d1077e9d2710a14aedc164fc3", ton: "UQCFeiYwfU9xPr5RkY9-X11HcYLMGPFq766OXZ5a0qyI_9dt", near: "7fb16d6c760050f8ff099b67a8b91db5762d835be5d257b0d4cb97af1cd0c909", sui: "0xc7489fba859d9f693e7b9de0de87c919a9b2a2ea8d9fbfb156c4e586f76cb4d5", xrp: "rGvJwEheqLztdxhz32Wgpm1TjPXopUFji", cardano: "addr1q827wexwa8ghk0zknmpllxrk26qvqq9me2e7s69n5shty9hnmevm45jtmst32qsvupk3hepyxkg3ezxzsw06evlelafsp9hksw", dogecoin: "DRYR9UiLC72EEXJMbP86aoCnL149JMLDcM", polkadot: "1nHzS9upAUikrpXCsE1yDHPR7n2r86NL79dHWCH6Wdw6jgc", litecoin: "ltc1qm2s8vkruqyhu9dpneuyct8paky7vemkzzagxur", bitcoincash: "bitcoincash:qpxq2ue80khteuvktl0skfgsm5r78yp7p5r5xsj0st", cosmos: "cosmos146ah07njwh2zyzc54ulwer8c7p3k002jtc6ucc", stellar: "GCWJQUWD2GLEFTR4752RQGHSTRZNP4FUIZUGW74M7SG6F4MUYTDL7AXV",
};

function AssetLogo({ asset }: { asset: Asset }) { return <span className="deposit-asset-logo" style={{ background: asset.color }}><img src={`https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`} alt={`${asset.name} logo`} /></span>; }
function NetworkLogo({ network }: { network: Network }) { return <span className="deposit-network-logo"><img src={`https://assets.coincap.io/assets/icons/${network.logo}@2x.png`} alt={`${network.name} logo`} /><span>{network.short.slice(0, 2)}</span></span>; }

export default function DepositPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Asset>(ASSETS[0]);
  const [networkId, setNetworkId] = useState("bsc");
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const filteredAssets = useMemo(() => { const value = query.trim().toLowerCase(); return value ? ASSETS.filter(asset => `${asset.symbol} ${asset.name}`.toLowerCase().includes(value)) : ASSETS; }, [query]);
  const selectedNetworks = NETWORKS[selected.symbol] ?? [];
  const selectedNetwork = selectedNetworks.find(item => item.id === networkId) ?? selectedNetworks[0];
  const depositAddress = DEMO_ADDRESSES[selectedNetwork?.id ?? ""] ?? "ORBITEX-DEMO-DEPOSIT-ADDRESS";
  function selectAsset(asset: Asset) { setSelected(asset); setNetworkId(NETWORKS[asset.symbol]?.[0]?.id ?? ""); setCopied(false); setShowDetails(true); }
  async function copyAddress() { try { await navigator.clipboard.writeText(depositAddress); } catch {} setCopied(true); window.setTimeout(() => setCopied(false), 1800); }

  return <main className="wallet-page"><header className="wallet-header"><Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link><Link href="/wallet" className="history-link"><ArrowLeft size={18} /> Back to Wallet</Link></header><div className="wallet-content deposit-content"><div className="wallet-heading"><div><span className="wallet-kicker">FUND YOUR ACCOUNT</span><h1>Deposit</h1><p>Choose a crypto and the network you want to use for your deposit.</p></div></div><section className="deposit-shell"><div className={`deposit-selector ${showDetails ? "mobile-hidden" : ""}`}><div className="deposit-section-heading"><div><span className="wallet-kicker">SELECT ASSET</span><h2>Choose a deposit asset</h2></div><span className="supported-count">20 supported assets</span></div><label className="deposit-search"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by coin name or symbol" /></label><div className="deposit-asset-grid">{filteredAssets.map(asset => <button key={asset.symbol} type="button" className={`deposit-asset-option ${selected.symbol === asset.symbol ? "selected" : ""}`} onClick={() => selectAsset(asset)}><AssetLogo asset={asset} /><span><strong>{asset.symbol}</strong><small>{asset.name}</small></span>{selected.symbol === asset.symbol && <Check size={17} className="asset-selected-check" />}</button>)}</div>{filteredAssets.length === 0 && <div className="deposit-no-results">No supported asset matches your search.</div>}</div><div className={`deposit-details ${showDetails ? "mobile-visible" : ""}`}><button type="button" className="mobile-back-button" onClick={() => setShowDetails(false)}><ArrowLeft size={17} /> Choose another asset</button><div className="selected-asset-heading"><AssetLogo asset={selected} /><div><span className="wallet-kicker">DEPOSIT ASSET</span><h2>{selected.name} <em>{selected.symbol}</em></h2></div></div><p className="deposit-helper">Select the network that matches the wallet or exchange you are sending from. Sending through the wrong network can permanently lose funds.</p><label className="deposit-field-label">Choose network</label><div className="deposit-network-list">{selectedNetworks.map(item => <button key={item.id} type="button" className={`deposit-network-option ${selectedNetwork?.id === item.id ? "selected" : ""}`} onClick={() => { setNetworkId(item.id); setCopied(false); }}><NetworkLogo network={item} /><span><strong>{item.name}</strong><small>{item.short}</small></span>{selectedNetwork?.id === item.id && <Check size={17} className="asset-selected-check" />}</button>)}</div><div className="deposit-address-box"><span>{selectedNetwork?.name} deposit address</span><strong>{depositAddress}</strong><button type="button" onClick={copyAddress}><Copy size={17} /> {copied ? "Copied" : "Copy address"}</button></div><button className="primary-action deposit-continue" type="button"><ArrowDownToLine size={18} /> Deposit {selected.symbol}</button><div className="deposit-security-note"><ShieldCheck size={18} /><span>Only send {selected.symbol} using the selected network.</span></div></div></section></div><MobileNav /></main>;
}
