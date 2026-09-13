"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Eye, EyeOff, History, WalletCards, BarChart3, TrendingUp, Plus, Bitcoin, CircleDollarSign, Clock3, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MobileNav from "../components/MobileNav";
import CoinIcon from "../components/CoinIcon";
import { getTestnetBalances, type TestnetWallet } from "../../lib/testnet-wallet";
import "./wallet.css";

type FundingTab = "all" | "deposits" | "withdrawals" | "transfers";

const assetNames: Record<string, string> = { USDT: "TetherUS", BTC: "Bitcoin", ETH: "Ethereum", BNB: "BNB", SOL: "Solana", XRP: "XRP", DOGE: "Dogecoin" };

export default function WalletPage() {
  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState("");
  const [balances, setBalances] = useState<TestnetWallet[]>([]);
  const [fundingTab, setFundingTab] = useState<FundingTab>("all");

  useEffect(() => {
    const refresh = () => setBalances(getTestnetBalances());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("wallet-balances-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("wallet-balances-updated", refresh);
    };
  }, []);

  const total = balances.reduce((sum, item) => sum + item.spot + item.futures, 0);
  const visibleAssets = useMemo(() => balances.filter((asset) => {
    const balance = asset.spot + asset.futures;
    return balance > 0 && `${asset.asset} ${assetNames[asset.asset] || asset.asset}`.toLowerCase().includes(query.toLowerCase());
  }), [balances, query]);
  const formatAmount = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 8 });

  const fundingLabels: Record<FundingTab, string> = {
    all: "All activity",
    deposits: "Deposits",
    withdrawals: "Withdrawals",
    transfers: "Transfers",
  };

  return (
    <main className="wallet-page">
      <header className="wallet-header">
        <Link href="/dashboard" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link>
        <nav><Link href="/dashboard">Overview</Link><Link href="/trade">Spot</Link><Link href="/wallet" className="active">Funding</Link><Link href="/futures">Futures</Link></nav>
        <Link href="/orders" className="history-link"><History size={18} /> History</Link>
      </header>

      <div className="wallet-content">
        <div className="wallet-heading"><div><span className="wallet-kicker">ACCOUNT</span><h1>Funding</h1><p>Manage your available balance and move funds.</p></div><div className="wallet-actions"><Link href="/wallet/deposit" className="primary-action"><ArrowDownToLine size={18} /> Deposit</Link><Link href="/wallet/withdraw" className="secondary-action"><ArrowUpFromLine size={18} /> Withdraw</Link><Link href="/wallet/transfer" className="secondary-action"><ArrowLeftRight size={18} /> Transfer</Link></div></div>

        <section className="wallet-balance-card"><div className="balance-copy"><span>Funding balance <button onClick={() => setHidden(!hidden)} aria-label="Toggle balance visibility">{hidden ? <EyeOff size={18} /> : <Eye size={18} />}</button></span><strong>{hidden ? "••••••" : `${formatAmount(total)} USDT`}</strong><small>≈ {hidden ? "••••" : `$${formatAmount(total)}`}</small></div><div className="balance-side"><span>Today’s PNL</span><strong>+0.00 USDT</strong><small>+0.00%</small></div></section>

        <div className="wallet-tabs"><Link className="active" href="/wallet">Overview</Link><Link href="/orders">Trading history</Link></div>

        <section className="wallet-panel"><div className="panel-top"><div><span className="wallet-kicker">FUNDING BALANCES</span><h2>{visibleAssets.length ? "Your assets" : "No assets yet"}</h2></div><label className="asset-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets" /></label></div>{visibleAssets.length > 0 ? <><div className="asset-table-head"><span>Asset</span><span>Balance</span><span>Value</span><span>24h change</span><span></span></div><div className="asset-list">{visibleAssets.map((asset) => { const amount = asset.spot + asset.futures; return <div className="asset-row" key={asset.asset}><div className="asset-identity"><CoinIcon symbol={asset.asset} size={38} /><div><strong>{asset.asset}</strong><span>{assetNames[asset.asset] || asset.asset}</span></div></div><strong>{hidden ? "••••" : formatAmount(amount)}</strong><strong>{hidden ? "••••" : `$${formatAmount(amount)}`}</strong><span className="asset-change">0.00%</span><span className="asset-arrow">›</span></div>; })}</div></> : <div className="empty-assets"><div className="empty-wallet-art"><span className="empty-coin empty-bitcoin"><Bitcoin size={23} /></span><span className="empty-coin empty-ethereum">◆</span><span className="empty-coin empty-usdt"><CircleDollarSign size={22} /></span><div className="empty-wallet-icon"><WalletCards size={54} /></div></div><strong>Your wallet is empty</strong><span>Deposit or buy crypto to get started and see your assets here.</span><div className="empty-actions"><Link href="/wallet/deposit" className="empty-primary"><ArrowDownToLine size={18} /> Deposit Crypto</Link><Link href="/trade" className="empty-secondary"><Plus size={18} /> Buy Crypto</Link></div></div>}</section>

        <section className="funding-history-panel">
          <div className="funding-history-heading"><div><span className="wallet-kicker">ACCOUNT ACTIVITY</span><h2>Deposit &amp; withdrawal history</h2><p>Track every deposit, withdrawal, and internal transfer from one place.</p></div><Link href="/orders" className="history-link"><History size={17} /> Trading history</Link></div>
          <div className="funding-history-tabs">{(Object.keys(fundingLabels) as FundingTab[]).map((tab) => <button key={tab} className={fundingTab === tab ? "active" : ""} onClick={() => setFundingTab(tab)}>{fundingLabels[tab]}</button>)}</div>
          <div className="funding-history-empty"><div className="funding-empty-icon"><Clock3 size={25} /></div><strong>No {fundingTab === "all" ? "funding activity" : fundingLabels[fundingTab].toLowerCase()} yet</strong><span>Your {fundingTab === "all" ? "deposits, withdrawals, and transfers" : fundingLabels[fundingTab].toLowerCase()} will appear here with the amount, status, network, and transaction details.</span><div className="funding-history-actions"><Link href="/wallet/deposit" className="history-deposit"><ArrowDownToLine size={17} /> Make a deposit</Link><Link href="/wallet/withdraw" className="history-withdraw"><ArrowUpFromLine size={17} /> Make a withdrawal</Link></div></div>
          <div className="funding-history-status-note"><CheckCircle2 size={16} /> Completed transactions will show their status and transaction reference here.</div>
        </section>

        <section className="wallet-trading-section"><div><span className="wallet-kicker">TRADE WITH YOUR BALANCE</span><h2>Trading</h2><p>Choose a separate trading section. Your funding balance is used when you move funds into trading.</p></div><div className="wallet-trading-actions"><Link href="/trade" className="trading-card"><span><BarChart3 size={22} /></span><div><strong>Spot Trading</strong><small>Buy and sell coins in the spot market.</small></div><b>→</b></Link><Link href="/futures" className="trading-card"><span><TrendingUp size={22} /></span><div><strong>Futures Trading</strong><small>Open and manage leveraged positions.</small></div><b>→</b></Link></div></section>

        <div className="wallet-notice"><WalletCards size={19} /><div><strong>Only owned assets are displayed</strong><span>Coins with zero balances are hidden. Your history contains separate spot orders and futures positions.</span></div></div>
      </div><MobileNav />
    </main>
  );
}
