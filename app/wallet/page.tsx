"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Eye, EyeOff, History, Search, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import MobileNav from "../components/MobileNav";
import CoinIcon from "../components/CoinIcon";
import { getTestnetBalances, type TestnetWallet } from "../../lib/testnet-wallet";
import "./wallet.css";

type WalletTab = "overview" | "spot" | "futures";

const assetNames: Record<string, string> = {
  USDT: "TetherUS",
  BTC: "Bitcoin",
  ETH: "Ethereum",
  BNB: "BNB",
  SOL: "Solana",
  XRP: "XRP",
  DOGE: "Dogecoin",
};

export default function WalletPage() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab: WalletTab = requestedTab === "spot" || requestedTab === "futures" ? requestedTab : "overview";
  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState("");
  const [balances, setBalances] = useState<TestnetWallet[]>([]);

  useEffect(() => {
    setBalances(getTestnetBalances());
    const refresh = () => setBalances(getTestnetBalances());
    window.addEventListener("storage", refresh);
    window.addEventListener("wallet-balances-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("wallet-balances-updated", refresh);
    };
  }, []);

  const totalSpot = balances.reduce((sum, item) => sum + item.spot, 0);
  const totalFutures = balances.reduce((sum, item) => sum + item.futures, 0);
  const total = totalSpot + totalFutures;

  const visibleAssets = useMemo(() => {
    const filtered = balances.filter((asset) => {
      const balance = tab === "spot" ? asset.spot : tab === "futures" ? asset.futures : asset.spot + asset.futures;
      const matchesQuery = `${asset.asset} ${assetNames[asset.asset] || asset.asset}`.toLowerCase().includes(query.toLowerCase());
      return balance > 0 && matchesQuery;
    });
    return filtered;
  }, [balances, tab, query]);

  const formatAmount = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 8 });
  const displayedTotal = tab === "spot" ? totalSpot : tab === "futures" ? totalFutures : total;
  const walletLabel = tab === "spot" ? "Spot Wallet" : tab === "futures" ? "Futures Wallet" : "Total Wallet Balance";

  return (
    <main className="wallet-page">
      <header className="wallet-header">
        <Link href="/dashboard" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link>
        <nav>
          <Link href="/dashboard">Overview</Link>
          <Link href="/trade">Spot</Link>
          <Link href="/wallet" className="active">Funding</Link>
          <Link href="/futures">Futures</Link>
        </nav>
        <Link href="/orders" className="history-link"><History size={18} /> History</Link>
      </header>

      <div className="wallet-content">
        <div className="wallet-heading">
          <div><span className="wallet-kicker">ACCOUNT</span><h1>Wallet</h1><p>Manage your balances and move funds securely.</p></div>
          <div className="wallet-actions">
            <Link href="/wallet/deposit" className="primary-action"><ArrowDownToLine size={18} /> Deposit</Link>
            <Link href="/wallet/withdraw" className="secondary-action"><ArrowUpFromLine size={18} /> Withdraw</Link>
            <Link href="/wallet/transfer" className="secondary-action"><ArrowLeftRight size={18} /> Transfer</Link>
          </div>
        </div>

        <section className="wallet-balance-card">
          <div className="balance-copy"><span>{walletLabel} <button onClick={() => setHidden(!hidden)} aria-label="Toggle balance visibility">{hidden ? <EyeOff size={18} /> : <Eye size={18} />}</button></span><strong>{hidden ? "••••••" : `${formatAmount(displayedTotal)} USDT`}</strong><small>≈ {hidden ? "••••" : `$${formatAmount(displayedTotal)}`}</small></div>
          <div className="balance-side"><span>Today’s PNL</span><strong>+0.00 USDT</strong><small>+0.00%</small></div>
        </section>

        <div className="wallet-tabs">
          <Link className={tab === "overview" ? "active" : ""} href="/wallet">Overview</Link>
          <Link className={tab === "spot" ? "active" : ""} href="/wallet?tab=spot">Spot Wallet</Link>
          <Link className={tab === "futures" ? "active" : ""} href="/wallet?tab=futures">Futures Wallet</Link>
          <Link href="/wallet/history">History</Link>
        </div>

        <section className="wallet-panel">
          <div className="panel-top"><div><span className="wallet-kicker">{tab === "overview" ? "OWNED ASSETS" : tab === "spot" ? "SPOT BALANCES" : "FUTURES BALANCES"}</span><h2>{visibleAssets.length ? "Your assets" : "No assets yet"}</h2></div><label className="asset-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets" /></label></div>
          {visibleAssets.length > 0 ? <>
            <div className="asset-table-head"><span>Asset</span><span>Balance</span><span>Value</span><span>24h change</span><span></span></div>
            <div className="asset-list">{visibleAssets.map((asset) => { const amount = tab === "spot" ? asset.spot : tab === "futures" ? asset.futures : asset.spot + asset.futures; return <div className="asset-row" key={asset.asset}><div className="asset-identity"><CoinIcon symbol={asset.asset} size={38} /><div><strong>{asset.asset}</strong><span>{assetNames[asset.asset] || asset.asset}</span></div></div><strong>{hidden ? "••••" : formatAmount(amount)}</strong><strong>{hidden ? "••••" : `$${formatAmount(amount)}`}</strong><span className="asset-change">0.00%</span><span className="asset-arrow">›</span></div>; })}</div>
          </> : <div className="empty-assets"><WalletCards size={28} /><strong>No assets in this wallet</strong><span>Buy or deposit an asset to see it here.</span></div>}
        </section>

        <div className="wallet-notice"><WalletCards size={19} /><div><strong>Only owned assets are displayed</strong><span>This wallet shows balances from completed purchases, deposits, and transfers. Empty assets are hidden.</span></div></div>
      </div>
      <MobileNav />
    </main>
  );
}
