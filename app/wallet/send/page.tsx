"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpFromLine, Check, Search, ShieldCheck, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import "../../wallet.css";
import "../deposit/deposit.css";
import "./send.css";

type Asset = { symbol: string; name: string; color: string };
type Network = { id: string; name: string; short: string; logo: string };

const ASSETS: Asset[] = [
  { symbol: "USDT", name: "Tether", color: "#26a17b" }, { symbol: "BTC", name: "Bitcoin", color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", color: "#627eea" }, { symbol: "BNB", name: "BNB", color: "#f3ba2f" },
  { symbol: "SOL", name: "Solana", color: "#8b5cf6" }, { symbol: "XRP", name: "XRP", color: "#64748b" },
  { symbol: "USDC", name: "USD Coin", color: "#2775ca" }, { symbol: "ADA", name: "Cardano", color: "#2563eb" },
  { symbol: "DOGE", name: "Dogecoin", color: "#c2a633" }, { symbol: "TRX", name: "TRON", color: "#ef4444" },
  { symbol: "AVAX", name: "Avalanche", color: "#e84142" }, { symbol: "LINK", name: "Chainlink", color: "#2a5ada" },
  { symbol: "DOT", name: "Polkadot", color: "#e6007a" }, { symbol: "POL", name: "Polygon", color: "#8247e5" },
  { symbol: "LTC", name: "Litecoin", color: "#345d9d" }, { symbol: "SHIB", name: "Shiba Inu", color: "#f28c28" },
  { symbol: "UNI", name: "Uniswap", color: "#ff007a" }, { symbol: "BCH", name: "Bitcoin Cash", color: "#0ac18e" },
  { symbol: "ATOM", name: "Cosmos", color: "#6f7390" }, { symbol: "XLM", name: "Stellar", color: "#8b93a7" },
];

const n = (id: string, name: string, short: string, logo: string): Network => ({ id, name, short, logo });
const NETWORKS: Record<string, Network[]> = {
  USDT: [n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("eth", "Ethereum", "ERC-20", "eth"), n("tron", "Tron", "TRC-20", "trx"), n("aptos", "Aptos", "Aptos", "apt"), n("solana", "Solana", "Solana", "sol"), n("arbitrum", "Arbitrum One", "Arbitrum", "arb"), n("ton", "TON", "TON", "ton"), n("optimism", "Optimism", "OP", "op"), n("near", "NEAR Protocol", "NEAR", "near"), n("polygon", "Polygon", "Polygon", "pol"), n("avalanche", "Avalanche C-Chain", "AVAX", "avax"), n("sui", "Sui", "Sui", "sui"), n("base", "Base", "Base", "base")],
  BTC: [n("bitcoin", "Bitcoin", "BTC", "btc"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("eth", "Ethereum", "ERC-20", "eth"), n("arbitrum", "Arbitrum One", "Arbitrum", "arb")],
  ETH: [n("eth", "Ethereum", "ERC-20", "eth"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("arbitrum", "Arbitrum One", "Arbitrum", "arb"), n("optimism", "Optimism", "OP", "op"), n("base", "Base", "Base", "base"), n("polygon", "Polygon", "Polygon", "pol"), n("linea", "Linea", "Linea", "linea")],
  BNB: [n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("eth", "Ethereum", "ERC-20", "eth"), n("arbitrum", "Arbitrum One", "Arbitrum", "arb")],
  SOL: [n("solana", "Solana", "Solana", "sol"), n("eth", "Ethereum", "ERC-20", "eth"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb")],
  XRP: [n("xrp", "XRP Ledger", "XRP", "xrp"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("eth", "Ethereum", "ERC-20", "eth")],
  USDC: [n("eth", "Ethereum", "ERC-20", "eth"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("solana", "Solana", "Solana", "sol"), n("arbitrum", "Arbitrum One", "Arbitrum", "arb"), n("base", "Base", "Base", "base"), n("polygon", "Polygon", "Polygon", "pol"), n("optimism", "Optimism", "OP", "op")],
  ADA: [n("cardano", "Cardano", "Cardano", "ada"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("eth", "Ethereum", "ERC-20", "eth")],
  DOGE: [n("dogecoin", "Dogecoin", "DOGE", "doge"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("eth", "Ethereum", "ERC-20", "eth")],
  TRX: [n("tron", "Tron", "TRC-20", "trx"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("eth", "Ethereum", "ERC-20", "eth")],
  AVAX: [n("avalanche", "Avalanche C-Chain", "AVAX", "avax"), n("eth", "Ethereum", "ERC-20", "eth"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("arbitrum", "Arbitrum One", "Arbitrum", "arb")],
  LINK: [n("eth", "Ethereum", "ERC-20", "eth"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("arbitrum", "Arbitrum One", "Arbitrum", "arb"), n("polygon", "Polygon", "Polygon", "pol"), n("optimism", "Optimism", "OP", "op"), n("base", "Base", "Base", "base")],
  DOT: [n("polkadot", "Polkadot", "DOT", "dot"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("eth", "Ethereum", "ERC-20", "eth")],
  POL: [n("polygon", "Polygon", "Polygon", "pol"), n("eth", "Ethereum", "ERC-20", "eth"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb")],
  LTC: [n("litecoin", "Litecoin", "LTC", "ltc"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("eth", "Ethereum", "ERC-20", "eth")],
  SHIB: [n("eth", "Ethereum", "ERC-20", "eth"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("arbitrum", "Arbitrum One", "Arbitrum", "arb")],
  UNI: [n("eth", "Ethereum", "ERC-20", "eth"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("arbitrum", "Arbitrum One", "Arbitrum", "arb"), n("polygon", "Polygon", "Polygon", "pol"), n("optimism", "Optimism", "OP", "op"), n("base", "Base", "Base", "base")],
  BCH: [n("bitcoincash", "Bitcoin Cash", "BCH", "bch"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb"), n("eth", "Ethereum", "ERC-20", "eth")],
  ATOM: [n("cosmos", "Cosmos Hub", "ATOM", "atom"), n("eth", "Ethereum", "ERC-20", "eth"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb")],
  XLM: [n("stellar", "Stellar", "XLM", "xlm"), n("eth", "Ethereum", "ERC-20", "eth"), n("bsc", "BNB Smart Chain", "BEP-20", "bnb")],
};

function AssetLogo({ asset }: { asset: Asset }) { return <span className="deposit-asset-logo" style={{ background: asset.color }}><img src={`https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`} alt={`${asset.name} logo`} /></span>; }
function NetworkLogo({ network }: { network: Network }) { return <span className="deposit-network-logo"><img src={`https://assets.coincap.io/assets/icons/${network.logo}@2x.png`} alt={`${network.name} logo`} /><span>{network.short.slice(0, 2)}</span></span>; }

export default function SendPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Asset>(ASSETS[0]);
  const [networkId, setNetworkId] = useState("bsc");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [mobileStep, setMobileStep] = useState<"assets" | "details">("assets");
  const filteredAssets = useMemo(() => { const q = query.trim().toLowerCase(); return q ? ASSETS.filter(a => `${a.symbol} ${a.name}`.toLowerCase().includes(q)) : ASSETS; }, [query]);
  const networks = NETWORKS[selected.symbol] || [];
  const selectedNetwork = networks.find(item => item.id === networkId) || networks[0];

  function chooseAsset(asset: Asset) { setSelected(asset); setNetworkId(NETWORKS[asset.symbol]?.[0]?.id || ""); setMessage(""); setMobileStep("details"); }
  function continueSend() { if (!address.trim() || !amount || Number(amount) <= 0) { setMessage("Enter a valid recipient address and amount to continue."); return; } setMessage(`Transfer preview: ${amount} ${selected.symbol} on ${selectedNetwork?.short || "selected network"}.`); }

  return (
    <main className="wallet-page">
      <div className="wallet-content deposit-content">
        <Link href="/wallet" className="history-link"><ArrowLeft size={18} /> Back to wallet</Link>
        <div className="wallet-heading" style={{ marginTop: 28 }}><div><span className="wallet-kicker">SEND FUNDS</span><h1>Send crypto</h1><p>Choose an asset, select its network, and send it to another wallet.</p></div></div>
        <div className="withdraw-layout">
          <section className={`withdraw-assets ${mobileStep === "details" ? "mobile-hidden" : ""}`}>
            <div className="panel-top"><div><span className="wallet-kicker">SELECT ASSET</span><h2>Choose an asset to send</h2></div><span className="asset-count">20 supported assets</span></div>
            <div className="asset-search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by coin name or symbol" /></div>
            <div className="asset-grid">{filteredAssets.map(asset => <button type="button" key={asset.symbol} className={`asset-choice ${selected.symbol === asset.symbol ? "selected" : ""}`} onClick={() => chooseAsset(asset)}><AssetLogo asset={asset} /><span><strong>{asset.symbol}</strong><small>{asset.name}</small></span>{selected.symbol === asset.symbol && <Check size={17} className="asset-selected-check" />}</button>)}</div>
            {!filteredAssets.length && <div className="deposit-no-results">No supported assets match your search.</div>}
          </section>
          <section className={`withdraw-form ${mobileStep === "assets" ? "mobile-hidden" : ""}`}>
            <button type="button" className="mobile-back-button" onClick={() => setMobileStep("assets")}><ArrowLeft size={17} /> Choose another asset</button>
            <div className="selected-asset"><AssetLogo asset={selected} /><div><span className="wallet-kicker">SEND ASSET</span><h2>{selected.name} <em>{selected.symbol}</em></h2></div></div>
            <p className="deposit-helper">Select the exact network used by the recipient. The asset and network must match, or funds may be lost.</p>
            <label className="field-label">Network<span>Choose the network for {selected.symbol}.</span></label>
            <div className="network-grid">{networks.map(network => <button type="button" key={network.id} className={`network-choice ${selectedNetwork?.id === network.id ? "selected" : ""}`} onClick={() => setNetworkId(network.id)}><NetworkLogo network={network} /><span><strong>{network.name}</strong><small>{network.short}</small></span>{selectedNetwork?.id === network.id && <Check size={16} className="asset-selected-check" />}</button>)}</div>
            <label className="field-label">Withdraw address<span>Enter the {selected.symbol} address on the {selectedNetwork?.name || "selected"} network.</span></label>
            <input className="wallet-input" value={address} onChange={e => setAddress(e.target.value)} placeholder={`${selected.symbol} ${selectedNetwork?.short || "network"} address`} />
            <label className="field-label">Amount<span>Available balance will appear here when funds are credited.</span></label>
            <div className="amount-wrap"><input className="wallet-input" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /><span>{selected.symbol}</span></div>
            <div className="selected-network-note"><Wallet size={15} /> Sending <strong>{selected.symbol}</strong> through <strong>{selectedNetwork?.name}</strong> ({selectedNetwork?.short}).</div>
            <button className="primary-action" type="button" onClick={continueSend}><ArrowUpFromLine size={18} /> Review transfer</button>
            {message && <div className="withdraw-notice">{message}</div>}
            <div className="form-warning"><ShieldCheck size={16} /> Verify the recipient address and network carefully before confirming. Transfers cannot normally be reversed.</div>
          </section>
        </div>
      </div>
    </main>
  );
}
