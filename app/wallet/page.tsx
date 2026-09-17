"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Copy, Eye, EyeOff, History, WalletCards, BarChart3, TrendingUp, Clock3, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MobileNav from "../components/MobileNav";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import "./wallet.css";

type FundingTab = "all" | "deposits" | "withdrawals" | "transfers";
type WalletAccount = { id: string; asset: string; network: string; deposit_address: string | null; status: string };
type Transaction = { id: string; created_at: string; amount: number; status: string; tx_hash?: string | null; type: "Deposit" | "Withdrawal" };

const formatAmount = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 8 });

export default function WalletPage() {
  const supabase = createSupabaseBrowserClient();
  const [hidden, setHidden] = useState(false);
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [fundingTab, setFundingTab] = useState<FundingTab>("all");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadWallet = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (mounted) setLoading(false); return; }

      const [{ data: wallet }, { data: deposits }, { data: withdrawals }, { data: ledger }] = await Promise.all([
        supabase.from("wallet_accounts").select("id, asset, network, deposit_address, status").eq("user_id", user.id).maybeSingle(),
        supabase.from("wallet_deposits").select("id, created_at, amount, status, tx_hash").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("wallet_withdrawals").select("id, created_at, amount, status, tx_hash").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("wallet_ledger_entries").select("amount").eq("user_id", user.id).eq("asset", "USDT"),
      ]);

      if (!mounted) return;
      const rows: Transaction[] = [
        ...((deposits || []).map((item) => ({ ...item, amount: Number(item.amount), type: "Deposit" as const }))),
        ...((withdrawals || []).map((item) => ({ ...item, amount: Number(item.amount), type: "Withdrawal" as const }))),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAccount(wallet as WalletAccount | null);
      setTransactions(rows);
      setBalance((ledger || []).reduce((sum, item) => sum + Number(item.amount || 0), 0));
      setLoading(false);
    };
    loadWallet();
    return () => { mounted = false; };
  }, [supabase]);

  const filteredTransactions = useMemo(() => transactions.filter((item) => fundingTab === "all" || (fundingTab === "deposits" && item.type === "Deposit") || (fundingTab === "withdrawals" && item.type === "Withdrawal")), [transactions, fundingTab]);
  const copyAddress = async () => {
    if (!account?.deposit_address) return;
    await navigator.clipboard.writeText(account.deposit_address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="wallet-page">
      <header className="wallet-header">
        <Link href="/dashboard" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link>
        <nav><Link href="/dashboard">Overview</Link><Link href="/trade">Spot</Link><Link href="/wallet" className="active">Funding</Link><Link href="/futures">Futures</Link></nav>
        <Link href="/orders" className="history-link"><History size={18} /> History</Link>
      </header>

      <div className="wallet-content">
        <div className="wallet-heading">
          <div><span className="wallet-kicker">ACCOUNT</span><h1>Funding</h1><p>Manage your available balance and move funds securely.</p></div>
          <div className="wallet-actions"><Link href="/wallet/deposit" className="primary-action"><ArrowDownToLine size={18} /> Deposit</Link><Link href="/wallet/withdraw" className="secondary-action"><ArrowUpFromLine size={18} /> Withdraw</Link><Link href="/wallet/transfer" className="secondary-action"><ArrowLeftRight size={18} /> Transfer</Link></div>
        </div>

        <section className="wallet-balance-card">
          <div className="balance-copy"><span>Funding balance <button onClick={() => setHidden(!hidden)} aria-label="Toggle balance visibility">{hidden ? <EyeOff size={18} /> : <Eye size={18} />}</button></span><strong>{loading || hidden ? (loading ? "Loading..." : "••••••") : `${formatAmount(balance)} USDT`}</strong><small>≈ {hidden || loading ? "••••" : `$${formatAmount(balance)}`}</small></div>
          <div className="balance-side"><span>Wallet status</span><strong>{account?.status === "active" ? "Active" : "Pending setup"}</strong><small>USDT · BEP20</small></div>
        </section>

        {account?.deposit_address ? <section className="wallet-panel deposit-address-panel"><div className="panel-top"><div><span className="wallet-kicker">DEPOSIT ADDRESS</span><h2>USDT on BNB Smart Chain</h2><p className="panel-subtitle">Send only USDT through the BEP20 network to this address.</p></div></div><div className="deposit-address-box"><code>{account.deposit_address}</code><button type="button" onClick={copyAddress}>{copied ? <CheckCircle2 size={17} /> : <Copy size={17} />} {copied ? "Copied" : "Copy"}</button></div><p className="wallet-inline-warning">Depositing another asset or using another network may permanently lose funds.</p></section> : <section className="wallet-panel"><div className="empty-assets"><div className="empty-wallet-icon"><WalletCards size={54} /></div><strong>Wallet setup pending</strong><span>Your unique USDT BEP20 deposit address will appear here after wallet provisioning is completed.</span></div></section>}

        <div className="wallet-tabs"><Link className="active" href="/wallet">Overview</Link><Link href="/orders">Trading history</Link></div>

        <section className="funding-history-panel" aria-label="Funding history"><div className="funding-history-heading"><div><span className="wallet-kicker">FUNDING HISTORY</span><h2>Deposit &amp; withdrawal history</h2><p>Track deposits, withdrawals, and transfers in one place.</p></div></div><div className="funding-history-tabs" role="tablist">{(["all", "deposits", "withdrawals", "transfers"] as FundingTab[]).map((tab) => <button type="button" role="tab" aria-selected={fundingTab === tab} key={tab} className={fundingTab === tab ? "active" : ""} onClick={() => setFundingTab(tab)}>{tab[0].toUpperCase() + tab.slice(1)}</button>)}</div><div className="funding-history-table"><div className="funding-history-table-head"><span>Date</span><span>Type</span><span>Asset</span><span>Amount</span><span>Status</span><span>Transaction</span></div>{filteredTransactions.length ? filteredTransactions.map((item) => <div className="funding-history-row" key={`${item.type}-${item.id}`}><span>{new Date(item.created_at).toLocaleString()}</span><span>{item.type}</span><span>USDT</span><strong>{item.type === "Withdrawal" ? "-" : "+"}{formatAmount(item.amount)}</strong><span>{item.status}</span><span>{item.tx_hash ? `${item.tx_hash.slice(0, 8)}...` : "—"}</span></div>) : <div className="funding-history-empty"><div className="funding-empty-icon"><Clock3 size={20} /></div><strong>No transactions yet</strong><span>Your {fundingTab === "all" ? "funding activity" : fundingTab} will appear here.</span></div>}</div></section>

        <section className="wallet-trading-section"><div><span className="wallet-kicker">TRADE WITH YOUR BALANCE</span><h2>Trading</h2><p>Move funds into trading when you are ready to buy, sell, or open positions.</p></div><div className="wallet-trading-actions"><Link href="/trade" className="trading-card"><span><BarChart3 size={22} /></span><div><strong>Spot Trading</strong><small>Buy and sell coins in the spot market.</small></div><b>→</b></Link><Link href="/futures" className="trading-card"><span><TrendingUp size={22} /></span><div><strong>Futures Trading</strong><small>Open and manage leveraged positions.</small></div><b>→</b></Link></div></section>
        <div className="wallet-notice"><WalletCards size={19} /><div><strong>Keep your funds secure</strong><span>Always verify the selected network and wallet address before confirming a deposit or withdrawal.</span></div></div>
      </div><MobileNav />
    </main>
  );
}
