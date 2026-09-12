"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  ArrowUpRight,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  LogOut,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import MobileNav from "../components/MobileNav";
import CoinIcon from "../components/CoinIcon";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import "./dashboard.css";
import "./compact.css";

type Market = {
  symbol: string;
  price: number;
  change: number;
};

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
  const [markets, setMarkets] = useState<Market[]>(initialMarkets);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;
    const load = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error || !data.user) {
        router.replace("/login?next=/dashboard");
        return;
      }
      setEmail(data.user.email || "");
      setLoading(false);
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setEmail(session.user.email || "");
        setLoading(false);
      } else {
        router.replace("/login?next=/dashboard");
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const loadLiveMarkets = async () => {
      try {
        const response = await fetch(
          "https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22%5D",
          { cache: "no-store" }
        );
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled || !Array.isArray(data)) return;

        const liveMarkets: Market[] = data.map((item: { symbol: string; lastPrice: string; priceChangePercent: string }) => ({
          symbol: item.symbol.replace("USDT", ""),
          price: Number(item.lastPrice),
          change: Number(item.priceChangePercent),
        }));

        if (liveMarkets.length) setMarkets(liveMarkets);
      } catch {
        // Keep the last successful prices visible if the market API is unavailable.
      }
    };

    loadLiveMarkets();
    const interval = window.setInterval(loadLiveMarkets, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const logout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login?next=/dashboard");
  };

  if (loading) {
    return <main className="member-dashboard"><div className="dashboard-loading">Checking your account…</div></main>;
  }

  const initials = (email.split("@")[0] || "U").slice(0, 1).toUpperCase();
  const money = hidden ? "••••••" : "$0.00";

  return (
    <main className="member-dashboard">
      <header className="member-header">
        <Link href="/dashboard" className="member-brand"><span>ORBITEX</span></Link>
        <nav className="member-header-nav">
          <Link className="active" href="/dashboard">Overview</Link>
          <Link href="/trade">Spot</Link>
          <Link href="/wallet">Funding</Link>
          <Link href="/futures">Futures</Link>
        </nav>
        <div className="member-profile">
          <span className="member-email">{email}</span>
          <span className="member-avatar">{initials}</span>
          <button onClick={logout} aria-label="Log out" className="member-logout"><LogOut size={17} /></button>
        </div>
      </header>

      <div className="member-main">
        <section className="account-top">
          <div className="account-title"><div className="eyebrow">ACCOUNT OVERVIEW</div><h1>Good to see you</h1></div>
          <button className="more-button" aria-label="More options"><MoreHorizontal size={21} /></button>
        </section>

        <section className="hero-balance">
          <div className="hero-left">
            <div className="balance-heading">
              <span>Estimated total value</span>
              <button onClick={() => setHidden(!hidden)} aria-label={hidden ? "Show balance" : "Hide balance"}>
                {hidden ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="balance-number">{money} <small>USD <ChevronRight size={16} /></small></div>
            <div className="pnl-line"><span>Today's P&amp;L</span><strong>+$0.00 (+0.00%)</strong><ChevronRight size={17} /></div>
          </div>
          <div className="hero-stats">
            <div><span>Total assets</span><strong>{money}</strong></div>
            <div><span>24h change</span><strong className="positive">0.00%</strong></div>
            <div><span>Total profit</span><strong className="positive">$0.00</strong></div>
            <div><span>Total orders</span><strong>0</strong></div>
          </div>
        </section>

        <section className="quick-actions" aria-label="Account actions">
          <Link href="/wallet" className="quick-action"><span className="quick-action-icon"><ArrowDown aria-hidden="true" /></span><b>Add funds</b></Link>
          <Link href="/wallet" className="quick-action"><span className="quick-action-icon"><ArrowUp aria-hidden="true" /></span><b>Send</b></Link>
          <Link href="/wallet" className="quick-action"><span className="quick-action-icon"><ArrowLeftRight aria-hidden="true" /></span><b>Transfer</b></Link>
          <Link href="/trade" className="quick-action"><span className="quick-action-icon"><ArrowUpRight aria-hidden="true" /></span><b>Trade</b></Link>
        </section>

        <section className="market-highlight">
          <div className="section-heading"><div><span>Markets</span><strong>Trending now</strong></div><Link href="/markets">See all <ChevronRight size={16} /></Link></div>
          <div className="market-strip">
            {markets.map(({ symbol, price, change }) => (
              <Link href={`/trade?pair=${symbol}/USDT`} className="market-chip" key={symbol}>
                <div><CoinIcon symbol={symbol} size={30} /><span>{symbol}/USDT</span></div>
                <strong>${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</strong>
                <em className={change < 0 ? "down" : "up"}>{change >= 0 ? "+" : ""}{change.toFixed(2)}%</em>
              </Link>
            ))}
          </div>
        </section>

        <div className="content-grid">
          <section className="asset-card">
            <div className="section-heading"><div><span>Portfolio</span><strong>Your assets</strong></div><Link href="/wallet">View all <ChevronRight size={16} /></Link></div>
            <div className="asset-total"><span>Total balance</span><strong>{money}</strong></div>
            <div className="empty-activity asset-empty"><div className="empty-icon"><WalletEmptyIcon /></div><strong>No assets yet</strong><span>Your deposited coins will appear here after funds are credited to your account.</span><Link href="/wallet">Add funds</Link></div>
          </section>
          <section className="activity-card">
            <div className="section-heading"><div><span>Activity</span><strong>Recent activity</strong></div><Link href="/orders">View all <ChevronRight size={16} /></Link></div>
            <div className="empty-activity"><div className="empty-icon"><Clock3 size={20} /></div><strong>No activity yet</strong><span>Your completed orders and transactions will appear here.</span><Link href="/markets">Explore markets</Link></div>
          </section>
        </div>

        <section className="product-row">
          <Link href="/trade" className="product-card"><span className="product-icon"><Plus size={20} /></span><div><strong>Spot trading</strong><span>Trade crypto with live prices and charts.</span></div><ChevronRight /></Link>
          <Link href="/futures" className="product-card"><span className="product-icon"><Activity size={20} /></span><div><strong>Futures</strong><span>Long, short and manage leverage.</span></div><ChevronRight /></Link>
        </section>

        <section className="security-strip"><ShieldCheck size={19} /><div><strong>Account security</strong><span>Authenticated session • Keep your credentials private.</span></div><Link href="/security">Manage</Link></section>
      </div>
      <MobileNav />
    </main>
  );
}

function WalletEmptyIcon() {
  return <span style={{ fontSize: 20, lineHeight: 1 }}>＋</span>;
}
