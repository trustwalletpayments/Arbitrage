"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Eye, EyeOff, History, Search, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import MobileNav from "../components/MobileNav";
import CoinIcon from "../components/CoinIcon";
import "./wallet.css";

type Asset = { symbol: string; name: string; balance: string; value: string; change: string };

const assets: Asset[] = [
  { symbol: "USDT", name: "TetherUS", balance: "0.00", value: "$0.00", change: "0.00%" },
  { symbol: "BTC", name: "Bitcoin", balance: "0.000000", value: "$0.00", change: "0.00%" },
  { symbol: "ETH", name: "Ethereum", balance: "0.000000", value: "$0.00", change: "0.00%" },
  { symbol: "BNB", name: "BNB", balance: "0.000000", value: "$0.00", change: "0.00%" },
  { symbol: "SOL", name: "Solana", balance: "0.000000", value: "$0.00", change: "0.00%" },
  { symbol: "XRP", name: "XRP", balance: "0.000000", value: "$0.00", change: "0.00%" },
];

export default function WalletPage() {
  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => assets.filter((asset) => `${asset.symbol} ${asset.name}`.toLowerCase().includes(query.toLowerCase())),
    [query]
  );
  const amount = hidden ? "••••••" : "0.00 USDT";

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
          <div className="balance-copy"><span>Total wallet balance <button onClick={() => setHidden(!hidden)} aria-label="Toggle balance visibility">{hidden ? <EyeOff size={18} /> : <Eye size={18} />}</button></span><strong>{amount}</strong><small>≈ {hidden ? "••••" : "$0.00"}</small></div>
          <div className="balance-side"><span>Today’s PNL</span><strong>+0.00 USDT</strong><small>+0.00%</small></div>
        </section>

        <div className="wallet-tabs"><Link className="active" href="/wallet">Overview</Link><Link href="/trade">Spot Wallet</Link><Link href="/futures">Futures Wallet</Link><Link href="/wallet/history">History</Link></div>

        <section className="wallet-panel">
          <div className="panel-top"><div><span className="wallet-kicker">BALANCES</span><h2>Your assets</h2></div><label className="asset-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets" /></label></div>
          <div className="asset-table-head"><span>Asset</span><span>Balance</span><span>Value</span><span>24h change</span><span></span></div>
          <div className="asset-list">{filtered.map((asset) => <div className="asset-row" key={asset.symbol}><div className="asset-identity"><CoinIcon symbol={asset.symbol} size={38} /><div><strong>{asset.symbol}</strong><span>{asset.name}</span></div></div><strong>{hidden ? "••••" : asset.balance}</strong><strong>{hidden ? "••••" : asset.value}</strong><span className="asset-change">{asset.change}</span><Link href={`/wallet/${asset.symbol.toLowerCase()}`} className="asset-arrow">›</Link></div>)}</div>
          {filtered.length === 0 && <div className="empty-assets">No assets found.</div>}
        </section>

        <div className="wallet-notice"><WalletCards size={19} /><div><strong>Your wallet is ready</strong><span>Deposit supported assets to start trading. Deposits and withdrawals are processed through the selected network.</span></div></div>
      </div>
      <MobileNav />
    </main>
  );
}

// Wallet UI rebuilt and ready for deployment.
