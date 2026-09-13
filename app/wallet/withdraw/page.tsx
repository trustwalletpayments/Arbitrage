"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpFromLine, Check, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import MobileNav from "../../components/MobileNav";
import "../wallet.css";
import "../deposit/deposit.css";

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

const N = (id: string, name: string, short: string, logo: string): Network => ({ id, name, short, logo });
const NETWORKS: Record<string, Network[]> = {
  USDT: [N("bsc","BNB Smart Chain","BEP-20","bnb"),N("eth","Ethereum","ERC-20","eth"),N("tron","Tron","TRC-20","trx"),N("aptos","Aptos","Aptos","apt"),N("solana","Solana","Solana","sol"),N("arbitrum","Arbitrum One","Arbitrum","arb"),N("ton","TON","TON","ton"),N("optimism","Optimism","OP","op"),N("near","NEAR Protocol","NEAR","near"),N("polygon","Polygon","Polygon","pol"),N("avalanche","Avalanche C-Chain","AVAX","avax"),N("sui","Sui","Sui","sui"),N("base","Base","Base","base")],
  BTC: [N("bitcoin","Bitcoin","BTC","btc"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("eth","Ethereum","ERC-20","eth"),N("arbitrum","Arbitrum One","Arbitrum","arb")],
  ETH: [N("eth","Ethereum","ERC-20","eth"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("arbitrum","Arbitrum One","Arbitrum","arb"),N("optimism","Optimism","OP","op"),N("base","Base","Base","base"),N("polygon","Polygon","Polygon","pol"),N("linea","Linea","Linea","linea")],
  BNB: [N("bsc","BNB Smart Chain","BEP-20","bnb"),N("eth","Ethereum","ERC-20","eth"),N("arbitrum","Arbitrum One","Arbitrum","arb")],
  SOL: [N("solana","Solana","Solana","sol"),N("eth","Ethereum","ERC-20","eth"),N("bsc","BNB Smart Chain","BEP-20","bnb")],
  XRP: [N("xrp","XRP Ledger","XRP","xrp"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("eth","Ethereum","ERC-20","eth")],
  USDC: [N("eth","Ethereum","ERC-20","eth"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("solana","Solana","Solana","sol"),N("arbitrum","Arbitrum One","Arbitrum","arb"),N("base","Base","Base","base"),N("polygon","Polygon","Polygon","pol"),N("optimism","Optimism","OP","op")],
  ADA: [N("cardano","Cardano","Cardano","ada"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("eth","Ethereum","ERC-20","eth")],
  DOGE: [N("dogecoin","Dogecoin","DOGE","doge"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("eth","Ethereum","ERC-20","eth")],
  TRX: [N("tron","Tron","TRC-20","trx"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("eth","Ethereum","ERC-20","eth")],
  AVAX: [N("avalanche","Avalanche C-Chain","AVAX","avax"),N("eth","Ethereum","ERC-20","eth"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("arbitrum","Arbitrum One","Arbitrum","arb")],
  LINK: [N("eth","Ethereum","ERC-20","eth"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("arbitrum","Arbitrum One","Arbitrum","arb"),N("polygon","Polygon","Polygon","pol"),N("optimism","Optimism","OP","op"),N("base","Base","Base","base")],
  DOT: [N("polkadot","Polkadot","DOT","dot"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("eth","Ethereum","ERC-20","eth")],
  POL: [N("polygon","Polygon","Polygon","pol"),N("eth","Ethereum","ERC-20","eth"),N("bsc","BNB Smart Chain","BEP-20","bnb")],
  LTC: [N("litecoin","Litecoin","LTC","ltc"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("eth","Ethereum","ERC-20","eth")],
  SHIB: [N("eth","Ethereum","ERC-20","eth"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("arbitrum","Arbitrum One","Arbitrum","arb")],
  UNI: [N("eth","Ethereum","ERC-20","eth"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("arbitrum","Arbitrum One","Arbitrum","arb"),N("polygon","Polygon","Polygon","pol"),N("optimism","Optimism","OP","op"),N("base","Base","Base","base")],
  BCH: [N("bitcoincash","Bitcoin Cash","BCH","bch"),N("bsc","BNB Smart Chain","BEP-20","bnb"),N("eth","Ethereum","ERC-20","eth")],
  ATOM: [N("cosmos","Cosmos Hub","ATOM","atom"),N("eth","Ethereum","ERC-20","eth"),N("bsc","BNB Smart Chain","BEP-20","bnb")],
  XLM: [N("stellar","Stellar","XLM","xlm"),N("eth","Ethereum","ERC-20","eth"),N("bsc","BNB Smart Chain","BEP-20","bnb")],
};

function CoinLogo({ asset, network }: { asset?: Asset; network?: Network }) {
  const symbol = asset?.symbol ?? network?.logo ?? "";
  const color = asset?.color ?? "#18324d";
  return <span className="deposit-asset-logo" style={{ background: color }}><img src={`https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`} alt="" /><span>{symbol.slice(0, 2)}</span></span>;
}

export default function WithdrawPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Asset>(ASSETS[0]);
  const [networkId, setNetworkId] = useState(NETWORKS.USDT[0].id);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState(false);
  const networks = NETWORKS[selected.symbol] ?? [];
  const filtered = useMemo(() => ASSETS.filter(a => `${a.symbol} ${a.name}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const network = networks.find(n => n.id === networkId) ?? networks[0];
  const chooseAsset = (asset: Asset) => { setSelected(asset); setNetworkId((NETWORKS[asset.symbol] ?? [])[0]?.id ?? ""); setNotice(false); };
  const submit = () => { if (!address.trim() || !amount || Number(amount) <= 0) return; setNotice(true); };

  return <main className="wallet-page">
    <header className="wallet-header"><Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link><Link href="/wallet" className="history-link"><ArrowLeft size={18}/> Back to Wallet</Link></header>
    <div className="wallet-content">
      <div className="wallet-heading"><div><span className="wallet-kicker">MOVE FUNDS OUT</span><h1>Withdraw crypto</h1><p>Choose an asset, select its network, and enter the recipient address.</p></div></div>
      <section className="withdraw-layout">
        <div className="wallet-panel withdraw-assets"><div className="panel-top"><div><span className="wallet-kicker">SELECT ASSET</span><h2>Choose a withdrawal asset</h2></div><span className="asset-count">20 supported assets</span></div>
          <div className="asset-search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by coin name or symbol"/></div>
          <div className="asset-grid">{filtered.map(asset => <button type="button" key={asset.symbol} className={`asset-choice ${selected.symbol === asset.symbol ? "selected" : ""}`} onClick={() => chooseAsset(asset)}><CoinLogo asset={asset}/><span><strong>{asset.symbol}</strong><small>{asset.name}</small></span>{selected.symbol === asset.symbol && <Check size={18}/>}</button>)}</div>
        </div>
        <div className="wallet-panel withdraw-form"><div className="selected-asset"><CoinLogo asset={selected}/><div><span className="wallet-kicker">WITHDRAW</span><h2>{selected.name} <em>{selected.symbol}</em></h2></div></div>
          <div className="field-label">Network <span>Choose the network used by the recipient</span></div>
          <div className="network-grid">{networks.map(item => <button type="button" key={item.id} className={`network-choice ${network?.id === item.id ? "selected" : ""}`} onClick={() => {setNetworkId(item.id); setNotice(false);}}><CoinLogo network={item}/><span><strong>{item.name}</strong><small>{item.short}</small></span>{network?.id === item.id && <Check size={17}/>}</button>)}</div>
          <div className="selected-network-note">You are withdrawing <strong>{selected.symbol}</strong> on <strong>{network?.name} ({network?.short})</strong>.</div>
          <label className="field-label" htmlFor="withdraw-address">Withdraw address</label><input id="withdraw-address" className="wallet-input" value={address} onChange={e => setAddress(e.target.value)} placeholder={`Enter ${selected.symbol} address on ${network?.short ?? "selected network"}`}/>
          <label className="field-label" htmlFor="withdraw-amount">Amount</label><div className="amount-wrap"><input id="withdraw-amount" className="wallet-input" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`0.00 ${selected.symbol}`}/><span>{selected.symbol}</span></div>
          <button type="button" className="primary-action" onClick={submit}><ArrowUpFromLine size={18}/> Withdraw {selected.symbol}</button>
          {notice && <div className="withdraw-notice"><Check size={18}/><span>Withdrawal request preview created. No real funds have been sent.</span></div>}
          <p className="form-warning"><ShieldCheck size={16}/> Always confirm the coin and network before sending. Using the wrong network may permanently lose funds.</p>
        </div>
      </section>
    </div><MobileNav />
  </main>;
}
