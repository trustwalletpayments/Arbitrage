"use client";

import Link from "next/link";
import { ArrowLeft, Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MobileNav from "../../components/MobileNav";
import "../wallet.css";
import "./deposit.css";

type Asset = { symbol: string; name: string; color: string };
type Network = { id: string; name: string; short: string; logo: string };

const ASSETS: Asset[] = [
  ["USDT","Tether","#26a17b"],["BTC","Bitcoin","#f7931a"],["ETH","Ethereum","#627eea"],["BNB","BNB","#f3ba2f"],["SOL","Solana","#8b5cf6"],["XRP","XRP","#64748b"],["USDC","USD Coin","#2775ca"],["ADA","Cardano","#2563eb"],["DOGE","Dogecoin","#c2a633"],["TRX","TRON","#ef4444"],["AVAX","Avalanche","#e84142"],["LINK","Chainlink","#2a5ada"],["DOT","Polkadot","#e6007a"],["POL","Polygon","#8247e5"],["LTC","Litecoin","#345d9d"],["SHIB","Shiba Inu","#f28c28"],["UNI","Uniswap","#ff007a"],["BCH","Bitcoin Cash","#0ac18e"],["ATOM","Cosmos","#6f7390"],["XLM","Stellar","#8b93a7"]].map(([symbol,name,color]) => ({symbol,name,color}));

const network = (id: string, name: string, short: string, logo: string): Network => ({id,name,short,logo});
const EVM = [network("bsc","BNB Smart Chain","BEP-20","bnb"), network("eth","Ethereum","ERC-20","eth"), network("arbitrum","Arbitrum One","Arbitrum","arb")];
const NETWORKS: Record<string, Network[]> = {
  USDT: [network("bsc","BNB Smart Chain","BEP-20","bnb"),network("eth","Ethereum","ERC-20","eth"),network("tron","Tron","TRC-20","trx"),network("aptos","Aptos","Aptos","apt"),network("solana","Solana","Solana","sol"),network("arbitrum","Arbitrum One","Arbitrum","arb"),network("ton","TON","TON","ton"),network("optimism","Optimism","OP","op"),network("near","NEAR Protocol","NEAR","near"),network("polygon","Polygon","Polygon","pol"),network("avalanche","Avalanche C-Chain","AVAX","avax"),network("sui","Sui","Sui","sui"),network("base","Base","Base","base")],
  BTC: [network("bitcoin","Bitcoin","BTC","btc"), ...EVM], ETH: [network("eth","Ethereum","ERC-20","eth"), ...EVM.slice(0,1), network("base","Base","Base","base"), network("polygon","Polygon","Polygon","pol"), network("linea","Linea","Linea","linea")], BNB: EVM, SOL: [network("solana","Solana","Solana","sol"), ...EVM], XRP: [network("xrp","XRP Ledger","XRP","xrp"), ...EVM], USDC: [network("eth","Ethereum","ERC-20","eth"),network("bsc","BNB Smart Chain","BEP-20","bnb"),network("solana","Solana","Solana","sol"),network("arbitrum","Arbitrum One","Arbitrum","arb"),network("base","Base","Base","base")], ADA: [network("cardano","Cardano","Cardano","ada"), ...EVM], DOGE: [network("dogecoin","Dogecoin","DOGE","doge"), ...EVM], TRX: [network("tron","Tron","TRC-20","trx"), ...EVM], AVAX: [network("avalanche","Avalanche C-Chain","AVAX","avax"), ...EVM], LINK: [network("eth","Ethereum","ERC-20","eth"),network("bsc","BNB Smart Chain","BEP-20","bnb"),network("arbitrum","Arbitrum One","Arbitrum","arb"),network("base","Base","Base","base")], DOT: [network("polkadot","Polkadot","DOT","dot"), ...EVM], POL: [network("polygon","Polygon","Polygon","pol"), ...EVM], LTC: [network("litecoin","Litecoin","LTC","ltc"), ...EVM], SHIB: [network("eth","Ethereum","ERC-20","eth"),network("bsc","BNB Smart Chain","BEP-20","bnb")], UNI: [network("eth","Ethereum","ERC-20","eth"),network("bsc","BNB Smart Chain","BEP-20","bnb"),network("arbitrum","Arbitrum One","Arbitrum","arb"),network("base","Base","Base","base")], BCH: [network("bitcoincash","Bitcoin Cash","BCH","bch"), ...EVM], ATOM: [network("cosmos","Cosmos Hub","ATOM","atom"), ...EVM], XLM: [network("stellar","Stellar","XLM","xlm"), ...EVM]
};

function Logo({ asset, network }: { asset?: Asset; network?: Network }) { const symbol = asset?.symbol ?? network?.logo ?? ""; return <span className="deposit-asset-logo" style={{background: asset?.color ?? "#18324d"}}><img src={`https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`} alt="" /><span>{symbol.slice(0,2)}</span></span>; }

export default function DepositPage() {
  const router = useRouter();
  const [query,setQuery] = useState("");
  const [selected,setSelected] = useState<Asset>(ASSETS[0]);
  const [networkId,setNetworkId] = useState("");
  const [showNetworks,setShowNetworks] = useState(false);
  const filtered = useMemo(() => ASSETS.filter(a => `${a.symbol} ${a.name}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const networks = NETWORKS[selected.symbol] ?? [];
  const selectedNetwork = networks.find(n => n.id === networkId);

  const chooseAsset = (asset: Asset) => {
    setSelected(asset);
    setNetworkId("");
    setShowNetworks(true);
  };

  const chooseNetwork = (item: Network) => {
    setNetworkId(item.id);
    router.push(`/wallet/deposit/address?asset=${encodeURIComponent(selected.symbol)}&assetName=${encodeURIComponent(selected.name)}&network=${encodeURIComponent(item.name)}&networkShort=${encodeURIComponent(item.short)}&networkId=${encodeURIComponent(item.id)}`);
  };

  return <main className="wallet-page"><header className="wallet-header"><Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link><Link href="/wallet" className="history-link"><ArrowLeft size={18}/> Back to Wallet</Link></header><div className="wallet-content deposit-content"><div className="wallet-heading"><div><span className="wallet-kicker">FUND YOUR ACCOUNT</span><h1>Deposit</h1><p>{showNetworks ? `Choose the network for your ${selected.symbol} deposit.` : "Choose a crypto and the network you want to use for your deposit."}</p></div></div><section className="deposit-shell"><div className={`deposit-selector withdraw-assets ${showNetworks ? "mobile-hidden" : ""}`}><div className="deposit-section-heading"><div><span className="wallet-kicker">SELECT ASSET</span><h2>Choose a deposit asset</h2></div><span className="supported-count">20 supported assets</span></div><label className="deposit-search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by coin name or symbol"/></label><div className="deposit-asset-grid">{filtered.map(asset => <button key={asset.symbol} type="button" className={`deposit-asset-option ${selected.symbol === asset.symbol ? "selected" : ""}`} onClick={() => chooseAsset(asset)}><Logo asset={asset}/><span><strong>{asset.symbol}</strong><small>{asset.name}</small></span>{selected.symbol === asset.symbol && <Check size={17} className="asset-selected-check"/>}</button>)}</div></div><div className={`deposit-details withdraw-form ${showNetworks ? "mobile-visible" : "mobile-hidden"}`}><button type="button" className="mobile-back-button" onClick={() => setShowNetworks(false)}><ArrowLeft size={17}/> Choose another asset</button><div className="selected-asset-heading"><Logo asset={selected}/><div><span className="wallet-kicker">DEPOSIT ASSET</span><h2>{selected.name} <em>{selected.symbol}</em></h2></div></div><p className="deposit-helper">Select the network that matches the wallet or exchange you are sending from. Sending through the wrong network can permanently lose funds.</p><div className="deposit-network-step"><label className="deposit-field-label">Choose network for {selected.symbol}</label><div className="deposit-network-list">{networks.map(item => <button key={item.id} type="button" className={`deposit-network-option ${networkId === item.id ? "selected" : ""}`} onClick={() => chooseNetwork(item)}><Logo network={item}/><span><strong>{selected.symbol} on {item.name}</strong><small>{item.short} network</small></span>{selectedNetwork?.id === item.id && <Check size={17} className="asset-selected-check"/>}</button>)}</div></div></div></section></div><MobileNav/></main>;
}
