"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowDown, ArrowLeftRight, ArrowUp, ArrowUpRight, ChevronRight, Clock3, Eye, EyeOff, LogOut, MoreHorizontal, Plus, ShieldCheck, Wallet } from "lucide-react";
import MobileNav from "../components/MobileNav";
import CoinIcon from "../components/CoinIcon";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import "./dashboard.css";
import "./compact.css";
import "./mobile-fix.css";

type Market = { symbol: string; price: number; change: number };
const initialMarkets: Market[] = [
  { symbol: "BTC", price: 77154.49, change: 2.32 },
  { symbol: "ETH", price: 3661.27, change: 1.48 },
  { symbol: "SOL", price: 147.62, change: 4.21 },
];

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [markets, setMarkets] = useState<Market[]>(initialMarkets);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;
    let checked = false;

    const load = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      checked = true;
      if (data.user) {
        setEmail(data.user.email || "");
        setLoading(false);
        return;
      }
      // Do not log a member out because of a temporary network/auth error.
      if (!error) router.replace("/login?next=/dashboard");
    };

    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setEmail(session.user.email || "");
        setLoading(false);
        return;
      }
      // Only an explicit SIGNED_OUT event is allowed to redirect.
      // INITIAL_SESSION or transient null sessions must not log users out.
      if (event === "SIGNED_OUT" && checked) {
        router.replace("/login?next=/dashboard");
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const loadLiveMarkets = async () => {
      try {
        const response = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22%5D", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled || !Array.isArray(data)) return;
        const liveMarkets: Market[] = data.map((item: { symbol: string; lastPrice: string; priceChangePercent: string }) => ({ symbol: item.symbol.replace("USDT", ""), price: Number(item.lastPrice), change: Number(item.priceChangePercent) }));
        if (liveMarkets.length) setMarkets(liveMarkets);
      } catch { }
    };
    loadLiveMarkets();
    const interval = window.setInterval(loadLiveMarkets, 15000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  const logout = async () => { const supabase = createSupabaseBrowserClient(); await supabase.auth.signOut(); router.replace("/login?next=/dashboard"); };
  if (loading) return <main className="member-dashboard"><div className="dashboard-loading">Checking your account…</div></main>;
  const initials = (email.split("@")[0] || "U").slice(0, 1).toUpperCase();
  const money = hidden ? "••••••" : "$0.00";

  return (
    <main className="member-dashboard">
      <header className="member-header">
        <Link href="/dashboard" className="member-brand"><span>ORBITEX</span></Link>
        <nav className="member-header-nav"><Link className="active" href="/dashboard">Overview</Link><Link href="/trade">Spot</Link><Link href="/wallet">Funding</Link><Link href="/futures">Futures</Link></nav>
        <div className="member-profile" style={{ position: "relative" }}>
          <span className="member-email">{email}</span>
          <button type="button" className="member-avatar" aria-label="Open account menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)} style={{ cursor: "pointer", border: "1px solid #315c91" }}>{initials}</button>
          <button onClick={logout} aria-label="Log out" className="member-logout"><LogOut size={17} /></button>
          {profileOpen && <div style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, width: 250, padding: 10, borderRadius: 16, border: "1px solid #263b56", background: "#0b1420", boxShadow: "0 18px 50px rgba(0,0,0,.45)", zIndex: 100 }}>
            <div style={{ padding: "8px 10px 12px", borderBottom: "1px solid #1d2b3d", marginBottom: 6 }}><div style={{ color: "#f1f5fb", fontWeight: 750, fontSize: 14 }}>My account</div><div style={{ color: "#7f90a5", fontSize: 11, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div></div>
            <ProfileMenuLink href="/profile" icon={<ShieldCheck size={16} />} label="Settings" onClick={() => setProfileOpen(false)} />
            <button type="button" onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 10px", border: 0, borderRadius: 10, background: "transparent", color: "#ff7184", cursor: "pointer", fontSize: 13, textAlign: "left" }}><LogOut size={16} /> Log out</button>
          </div>}
        </div>
      </header>
      <div className="member-main">
        <section className="account-top"><div className="account-title"><div className="eyebrow">ACCOUNT OVERVIEW</div><h1>Good to see you</h1></div><button className="more-button" aria-label="More options"><MoreHorizontal size={21} /></button></section>
        <section className="hero-balance"><div className="hero-left"><div className="balance-heading"><span>Estimated total value</span><button onClick={() => setHidden(!hidden)} aria-label={hidden ? "Show balance" : "Hide balance"}>{hidden ? <EyeOff size={20} /> : <Eye size={20} />}</button></div><div className="balance-number">{money} <small>USD <ChevronRight size={16} /></small></div><div className="pnl-line"><span>Today's P&amp;L</span><strong>+$0.00 (+0.00%)</strong><ChevronRight size={17} /></div></div></section>
        <section className="quick-actions" aria-label="Account actions"><Link href="/wallet/deposit" className="quick-action"><span className="quick-action-icon"><ArrowDown aria-hidden="true" /></span><b>Add funds</b></Link><Link href="/wallet/send" className="quick-action"><span className="quick-action-icon"><ArrowUp aria-hidden="true" /></span><b>Send</b></Link><Link href="/wallet/transfer" className="quick-action"><span className="quick-action-icon"><ArrowLeftRight aria-hidden="true" /></span><b>Transfer</b></Link><Link href="/trade" className="quick-action"><span className="quick-action-icon"><ArrowUpRight aria-hidden="true" /></span><b>Trade</b></Link></section>
        <section className="market-highlight"><div className="section-heading"><div><span>Markets</span><strong>Trending now</strong></div><Link href="/markets">See all <ChevronRight size={16} /></Link></div><div className="market-strip">{markets.map(({ symbol, price, change }) => <Link href={`/trade?pair=${symbol}/USDT`} className="market-chip" key={symbol}><div><CoinIcon symbol={symbol} size={30} /><span>{symbol}/USDT</span></div><strong>${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</strong><em className={change < 0 ? "down" : "up"}>{change >= 0 ? "+" : ""}{change.toFixed(2)}%</em></Link>)}</div></section>
        <div className="content-grid"><section className="asset-card"><div className="section-heading"><div><span>Portfolio</span><strong>Your assets</strong></div><Link href="/wallet">View all <ChevronRight size={16} /></Link></div><div className="asset-total"><span>Total balance</span><strong>{money}</strong></div><div className="empty-activity asset-empty"><Link href="/wallet/deposit" className="empty-icon" aria-label="Add funds"><WalletEmptyIcon /></Link><strong>No assets yet</strong><span>Your deposited coins will appear here after funds are credited to your account.</span><Link href="/wallet/deposit">Add funds</Link></div></section><section className="activity-card"><div className="section-heading"><div><span>Activity</span><strong>Recent activity</strong></div><Link href="/orders">View all <ChevronRight size={16} /></Link></div><div className="empty-activity"><div className="empty-icon"><Clock3 size={20} /></div><strong>No activity yet</strong><span>Your completed orders and transactions will appear here.</span><Link href="/markets">Explore markets</Link></div></section></div>
        <section className="product-row"><Link href="/trade" className="product-card"><span className="product-icon"><Plus size={20} /></span><div><strong>Spot trading</strong><span>Trade crypto with live prices and charts.</span></div><ChevronRight /></Link><Link href="/futures" className="product-card"><span className="product-icon"><Activity size={20} /></span><div><strong>Futures</strong><span>Long, short and manage leverage.</span></div><ChevronRight /></Link></section>
        <section className="security-strip"><ShieldCheck size={19} /><div><strong>Account security</strong><span>Authenticated session • Keep your credentials private.</span></div><Link href="/security">Manage</Link></section>
      </div><MobileNav />
    </main>
  );
}

function ProfileMenuLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) { return <Link href={href} onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 10px", borderRadius: 10, color: "#dce6f3", textDecoration: "none", fontSize: 13 }}>{icon}<span>{label}</span></Link>; }
function WalletEmptyIcon() { return <span style={{ fontSize: 20, lineHeight: 1 }}>＋</span>; }
