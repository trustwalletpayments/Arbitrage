"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, X, Search, ShieldAlert, Clock3 } from "lucide-react";
import { TokenIcon, NetworkIcon } from "@web3icons/react/dynamic";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MobileNav from "../../components/MobileNav";
import "../wallet.css";
import "./deposit.css";

type Asset = { symbol: string; name: string; color: string; icon: string };
type Network = { id: string; name: string; short: string; icon: string; assets: string[] };
type SupportedRoute = { asset: string; network: string; type: "native" | "erc20"; ready: boolean };\ntype RecentDeposit = { id: string; created_at: string; amount: number; status: string; tx_hash?: string | null };

const ASSETS: Asset[] = [
  { symbol: "USDT", name: "Tether", color: "#26a17b", icon: "tether" }, { symbol: "USDC", name: "USD Coin", color: "#2775ca", icon: "usdcoin" }, { symbol: "ETH", name: "Ethereum", color: "#627eea", icon: "ethereum" }, { symbol: "BTC", name: "Bitcoin", color: "#f7931a", icon: "bitcoin" }, { symbol: "BNB", name: "BNB", color: "#f3ba2f", icon: "bnbchain" }, { symbol: "SOL", name: "Solana", color: "#111111", icon: "solana" }, { symbol: "XRP", name: "XRP", color: "#23292f", icon: "xrp" }, { symbol: "TRX", name: "TRON", color: "#ef0027", icon: "tron" }, { symbol: "ADA", name: "Cardano", color: "#0033ad", icon: "cardano" }, { symbol: "AVAX", name: "Avalanche", color: "#e84142", icon: "avalanche" }, { symbol: "FTM", name: "Fantom", color: "#1969ff", icon: "fantom" }, { symbol: "CRO", name: "Cronos", color: "#002d74", icon: "cronos" }, { symbol: "DOT", name: "Polkadot", color: "#e6007a", icon: "polkadot" }, { symbol: "LINK", name: "Chainlink", color: "#2a5ada", icon: "chainlink" }, { symbol: "LTC", name: "Litecoin", color: "#345d9d", icon: "litecoin" }, { symbol: "DOGE", name: "Dogecoin", color: "#c2a633", icon: "dogecoin" }, { symbol: "POL", name: "Polygon", color: "#8247e5", icon: "polygon" }, { symbol: "UNI", name: "Uniswap", color: "#ff007a", icon: "uniswap" }, { symbol: "ATOM", name: "Cosmos", color: "#2e3148", icon: "cosmos" }, { symbol: "NEAR", name: "NEAR Protocol", color: "#111111", icon: "near" }, { symbol: "APT", name: "Aptos", color: "#111111", icon: "aptos" }, { symbol: "SUI", name: "Sui", color: "#6fbcf0", icon: "sui" }, { symbol: "TON", name: "Toncoin", color: "#0098ea", icon: "ton" }, { symbol: "XLM", name: "Stellar", color: "#000000", icon: "stellar" }, { symbol: "BCH", name: "Bitcoin Cash", color: "#0ac18e", icon: "bitcoincash" }, { symbol: "ARB", name: "Arbitrum", color: "#28a0f0", icon: "arbitrum" },
];

const NETWORKS: Network[] = [
  { id: "ethereum", name: "Ethereum", short: "ERC-20", icon: "ethereum", assets: ["ETH", "USDT", "USDC", "LINK", "UNI"] }, { id: "bsc", name: "BNB Smart Chain", short: "BEP-20", icon: "bnbchain", assets: ["BNB", "USDT", "USDC", "LINK", "UNI", "POL", "AVAX", "ETH"] }, { id: "polygon", name: "Polygon", short: "Polygon", icon: "polygon", assets: ["POL", "USDT", "USDC", "ETH", "LINK", "UNI"] }, { id: "arbitrum", name: "Arbitrum One", short: "Arbitrum", icon: "arbitrum", assets: ["ETH", "USDT", "USDC", "ARB", "LINK", "UNI"] }, { id: "optimism", name: "Optimism", short: "Optimism", icon: "optimism", assets: ["ETH", "USDT", "USDC", "LINK", "UNI"] }, { id: "base", name: "Base", short: "Base", icon: "base", assets: ["ETH", "USDT", "USDC", "LINK", "UNI"] }, { id: "avalanche", name: "Avalanche C-Chain", short: "C-Chain", icon: "avalanche", assets: ["AVAX", "USDT", "USDC", "LINK", "UNI"] }, { id: "fantom", name: "Fantom", short: "Fantom", icon: "fantom", assets: ["FTM", "USDT", "ETH"] }, { id: "cronos", name: "Cronos", short: "Cronos", icon: "cronos", assets: ["CRO", "USDT", "USDC", "ETH"] }, { id: "linea", name: "Linea", short: "Linea", icon: "linea", assets: ["ETH", "USDT", "USDC"] }, { id: "bitcoin", name: "Bitcoin", short: "Bitcoin", icon: "bitcoin", assets: ["BTC"] }, { id: "solana", name: "Solana", short: "Solana", icon: "solana", assets: ["SOL", "USDT", "USDC"] }, { id: "tron", name: "TRON", short: "TRC-20", icon: "tron", assets: ["TRX", "USDT", "USDC"] }, { id: "xrp", name: "XRP Ledger", short: "XRP", icon: "xrp", assets: ["XRP"] }, { id: "cardano", name: "Cardano", short: "Cardano", icon: "cardano", assets: ["ADA"] }, { id: "polkadot", name: "Polkadot", short: "Polkadot", icon: "polkadot", assets: ["DOT"] }, { id: "litecoin", name: "Litecoin", short: "Litecoin", icon: "litecoin", assets: ["LTC"] }, { id: "dogecoin", name: "Dogecoin", short: "Dogecoin", icon: "dogecoin", assets: ["DOGE"] }, { id: "cosmos", name: "Cosmos Hub", short: "Cosmos", icon: "cosmos", assets: ["ATOM"] }, { id: "near", name: "NEAR", short: "NEAR", icon: "near", assets: ["NEAR"] }, { id: "aptos", name: "Aptos", short: "Aptos", icon: "aptos", assets: ["APT"] }, { id: "sui", name: "Sui", short: "Sui", icon: "sui", assets: ["SUI"] }, { id: "ton", name: "TON", short: "TON", icon: "ton", assets: ["TON"] }, { id: "stellar", name: "Stellar", short: "Stellar", icon: "stellar", assets: ["XLM"] }, { id: "bitcoincash", name: "Bitcoin Cash", short: "BCH", icon: "bitcoincash", assets: ["BCH"] },
];

const EVM_NETWORK_IDS = new Set(["ethereum", "bsc", "polygon", "arbitrum", "optimism", "base", "avalanche", "fantom", "cronos", "linea"]);
const EVM_NATIVE_ASSET: Record<string, string> = { ethereum: "ETH", bsc: "BNB", polygon: "POL", arbitrum: "ETH", optimism: "ETH", base: "ETH", avalanche: "AVAX", fantom: "FTM", cronos: "CRO", linea: "ETH" };
const EVM_ETH_TOKEN_NETWORKS = new Set(["bsc", "polygon", "fantom", "cronos"]);

function Logo({ asset, network }: { asset?: Asset; network?: Network }) {
  const label = asset?.symbol ?? network?.short ?? ""; const color = asset?.color ?? "#18324d";
  return <span className="deposit-asset-logo" style={{ background: `${color}22`, border: `1px solid ${color}55` }}>{asset ? <TokenIcon symbol={asset.symbol.toLowerCase()} size={28} variant="branded" fallback={<span className="deposit-logo-fallback" style={{ color }}>{label.slice(0, 2)}</span>} /> : <NetworkIcon network={network?.id || ""} size={28} variant="branded" fallback={<span className="deposit-logo-fallback" style={{ color }}>{label.slice(0, 2)}</span>} />}</span>;
}

export default function DepositPage() {
  const router = useRouter(); const [selectedAsset, setSelectedAsset] = useState<Asset | null>(ASSETS[0]); const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null); const [showNetworks, setShowNetworks] = useState(false); const [search, setSearch] = useState(""); const [supportedRoutes, setSupportedRoutes] = useState<SupportedRoute[]>([]); const [loadingRoutes, setLoadingRoutes] = useState(true); const [recentDeposits, setRecentDeposits] = useState<RecentDeposit[]>([]); const [loadingRecentDeposits, setLoadingRecentDeposits] = useState(true);
  const filteredAssets = useMemo(() => ASSETS.filter((asset) => `${asset.symbol} ${asset.name}`.toLowerCase().includes(search.toLowerCase())), [search]);
  const availableNetworks = useMemo(() => selectedAsset ? NETWORKS.filter((network) => network.assets.includes(selectedAsset.symbol)) : [], [selectedAsset]);

  useEffect(() => { let cancelled = false; async function loadSupportedRoutes() { setLoadingRoutes(true); try { const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; if (!supabaseUrl || !supabaseKey) return; const supabase = createClient(supabaseUrl, supabaseKey); const { data: { session } } = await supabase.auth.getSession(); if (!session?.access_token) return; const response = await fetch("/api/wallet/supported-deposits", { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" }); const result = await response.json().catch(() => ({})); if (!cancelled && response.ok && Array.isArray(result.routes)) setSupportedRoutes(result.routes); } finally { if (!cancelled) setLoadingRoutes(false); } } loadSupportedRoutes(); return () => { cancelled = true; }; }, []);

  const backendRouteKeys = useMemo(() => new Set(supportedRoutes.filter((route) => route.ready).map((route) => `${route.asset}:${route.network}`)), [supportedRoutes]);
  const isEnabled = (asset: string, network: string) => backendRouteKeys.has(`${asset}:${network}`) || (asset === "BTC" && network === "bitcoin") || (EVM_NETWORK_IDS.has(network) && (asset === "USDT" || asset === "USDC" || EVM_NATIVE_ASSET[network] === asset || (asset === "ETH" && EVM_ETH_TOKEN_NETWORKS.has(network))));
  const enabledRouteCount = useMemo(() => NETWORKS.reduce((count, network) => count + network.assets.filter((asset) => isEnabled(asset, network.id)).length, 0), [supportedRoutes]);
  useEffect(() => { let cancelled = false; async function loadRecentDeposits() { setLoadingRecentDeposits(true); try { const supabase = createSupabaseBrowserClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { data } = await supabase.from("wallet_deposits").select("id, created_at, amount, status, tx_hash").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8); if (!cancelled) setRecentDeposits((data || []).map((item: any) => ({ id: String(item.id), created_at: String(item.created_at), amount: Number(item.amount || 0), status: String(item.status || "pending"), tx_hash: item.tx_hash ? String(item.tx_hash) : null }))); } catch {} finally { if (!cancelled) setLoadingRecentDeposits(false); } } loadRecentDeposits(); return () => { cancelled = true; }; }, []);

  const chooseAsset = (asset: Asset) => { setSelectedAsset(asset); setSelectedNetwork(null); setShowNetworks(true); };
  const clearSelection = () => { setSelectedAsset(null); setSelectedNetwork(null); setShowNetworks(false); setSearch(""); };
  const chooseNetwork = (network: Network) => { if (!selectedAsset || !isEnabled(selectedAsset.symbol, network.id)) return; setSelectedNetwork(network); };
  const generateAddress = () => { if (!selectedAsset || !selectedNetwork || !isEnabled(selectedAsset.symbol, selectedNetwork.id)) return; router.push(`/wallet/deposit/address?asset=${selectedAsset.symbol}&assetName=${encodeURIComponent(selectedAsset.name)}&network=${encodeURIComponent(selectedNetwork.name)}&networkShort=${encodeURIComponent(selectedNetwork.short)}&networkId=${selectedNetwork.id}`); };

  return <main className="wallet-page">
    <header className="wallet-header">
      <Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link>
      <Link href="/wallet" className="history-link"><ArrowLeft size={18} /> Back to Wallet</Link>
    </header>
    <div className="wallet-content deposit-content">
      <div className="wallet-heading">
        <div><span className="wallet-kicker">FUND YOUR ACCOUNT</span><h1>Deposit</h1><p>{selectedAsset && showNetworks ? \`Choose a network for \${selectedAsset.symbol}.\` : "Receive crypto into your Orbitex account using a supported network."}</p></div>
      </div>

      <section className="deposit-shell deposit-workspace">
        <div className={\`deposit-selector withdraw-assets \${showNetworks ? "mobile-hidden" : ""}\`}>
          <div className="deposit-section-heading">
            <div><span className="wallet-kicker">STEP 1</span><h2>Select coin</h2><p className="deposit-step-subtitle">Choose the asset you want to receive.</p></div>
            <span className="supported-count">{ASSETS.length} assets</span>
          </div>
          <div className="deposit-selected-strip">
            {selectedAsset ? <span className="deposit-selected-chip"><Check size={14}/><strong>Selected {selectedAsset.symbol}</strong><button type="button" onClick={clearSelection}>Clear</button></span> : <span className="deposit-empty-selection">No coin selected</span>}
            <div className="deposit-search-wrap"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search asset..." aria-label="Search deposit assets"/>{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={16}/></button>}</div>
          </div>
          <div className="deposit-asset-grid">
            {filteredAssets.map((asset) => { const enabled = NETWORKS.some((network) => isEnabled(asset.symbol, network.id)); return <button key={asset.symbol} type="button" className={\`deposit-asset-option \${selectedAsset?.symbol === asset.symbol ? "selected" : ""}\`} onClick={() => chooseAsset(asset)}><Logo asset={asset}/><span><strong>{asset.symbol}</strong><small>{asset.name}</small></span>{enabled ? <Check size={17} className="asset-selected-check"/> : <ChevronRight size={17}/>}</button>; })}
          </div>
          <p className="deposit-helper">{loadingRoutes ? "Loading available deposit networks…" : "${enabledRouteCount} deposit routes are currently available. Unsupported networks stay disabled until their wallet adapter is enabled."}</p>
        </div>

        <div className={\`deposit-details withdraw-form \${showNetworks ? "mobile-visible" : "mobile-hidden"}\`}>
          {selectedAsset ? <>
            <button type="button" className="mobile-back-button" onClick={() => setShowNetworks(false)}><ArrowLeft size={17}/> Choose another asset</button>
            <div className="deposit-step-heading">
              <div className="deposit-step-index done">1</div>
              <div><span className="wallet-kicker">SELECTED COIN</span><strong>{selectedAsset.name} · {selectedAsset.symbol}</strong></div>
              <button type="button" className="deposit-clear-button" onClick={clearSelection}>Clear</button>
            </div>
            <div className="selected-asset-heading"><Logo asset={selectedAsset}/><div><span className="wallet-kicker">DEPOSIT ASSET</span><h2>{selectedAsset.name} <em>{selectedAsset.symbol}</em></h2></div></div>
            <div className="deposit-warning"><ShieldAlert size={18}/><span><strong>Match the asset and network.</strong> Send only {selectedAsset.symbol} through the selected network. Sending another asset or using another network may result in permanent loss.</span></div>
            <div className="deposit-network-step">
              <label className="deposit-field-label"><span>STEP 2</span> Select network for {selectedAsset.symbol}</label>
              <div className="deposit-selected-network">{selectedNetwork ? <><Check size={15}/><strong>{selectedNetwork.name}</strong><span>{selectedNetwork.short}</span><button type="button" onClick={() => setSelectedNetwork(null)}>Clear</button></> : <span>No network selected</span>}</div>
              <div className="deposit-network-list">
                {availableNetworks.map((network) => { const enabled = isEnabled(selectedAsset.symbol, network.id); const evmNetwork = EVM_NETWORK_IDS.has(network.id); return <button key={network.id} type="button" className={\`deposit-network-option \${selectedNetwork?.id === network.id ? "selected" : ""}\`} onClick={() => chooseNetwork(network)} disabled={!enabled} title={enabled ? \`Deposit \${selectedAsset.symbol} on \${network.name}\` : evmNetwork ? "EVM deposit route is not available" : "Coming soon — wallet adapter not implemented yet"} style={!enabled ? {opacity:.55,cursor:"not-allowed"} : undefined}><Logo network={network}/><span><strong>{selectedAsset.symbol} on {network.name}</strong><small>{network.short} network{enabled ? "" : " • Coming soon"}</small></span><div className="deposit-network-meta"><span>Minimum deposit</span><b>Network dependent</b></div><ChevronRight size={17}/></button>; })}
              </div>
              <div className="deposit-platform-note"><ShieldAlert size={16}/><span>Always confirm the asset and network on the sending platform before submitting the transfer.</span></div>
              {selectedNetwork && <div className="deposit-confirm-bar"><div><span>STEP 3</span><strong>Ready to generate</strong><small>Expected arrival: after network confirmation</small></div><button type="button" onClick={generateAddress}>Generate deposit address <ChevronRight size={17}/></button></div>}
            </div>
          </> : <div className="deposit-no-selection"><div className="deposit-no-selection-icon">+</div><strong>Select a coin to begin</strong><span>Your available networks and deposit details will appear here.</span></div>}
        </div>
      </section>

      <section className="recent-deposits-card" aria-label="Recent deposits">
        <div className="recent-deposits-head"><div><span className="wallet-kicker">DEPOSIT HISTORY</span><h2>Recent Deposits</h2><p>Your latest completed and pending deposits.</p></div><span className="recent-history-link">History</span></div>
        {loadingRecentDeposits ? <div className="recent-deposit-empty"><Clock3 size={20}/><span>Loading deposit history…</span></div> : recentDeposits.length ? <div className="recent-deposit-list">{recentDeposits.map((item) => <div className="recent-deposit-row" key={item.id}><div><strong>Deposit</strong><span>{new Date(item.created_at).toLocaleString()}</span></div><b>+{item.amount.toLocaleString(undefined,{maximumFractionDigits:8})}</b><span className={\`recent-status \${item.status.toLowerCase()}\`}>{item.status}</span><span>{item.tx_hash ? \`\${item.tx_hash.slice(0,8)}...\${item.tx_hash.slice(-6)}\` : "—"}</span></div>)}</div> : <div className="recent-deposit-empty"><Clock3 size={20}/><div><strong>No recent deposits yet</strong><span>Your completed and pending deposits will appear here.</span></div></div>}
      </section>
    </div>
    <MobileNav />
  </main>;