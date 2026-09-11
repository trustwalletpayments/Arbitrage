"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Activity,ArrowLeftRight,BarChart3,Clock3,LogOut,ShieldCheck,TrendingDown,TrendingUp,WalletCards} from "lucide-react";
import {useRouter} from "next/navigation";
import MobileNav from "../components/MobileNav";
import CoinIcon from "../components/CoinIcon";
import {createSupabaseBrowserClient} from "../lib/supabase-browser";
import "./dashboard.css";

const markets=[["BTC","77,154.49","+2.32%"],["ETH","3,661.27","+1.48%"],["SOL","147.62","+4.21%"],["BNB","712.34","-3.85%"]] as const;
const assets=[["USDT","0.00","$0.00"],["BTC","0.00000000","$0.00"],["ETH","0.00000000","$0.00"],["SOL","0.00000000","$0.00"]] as const;

export default function Dashboard(){
 const router=useRouter();
 const [email,setEmail]=useState("");
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  const supabase=createSupabaseBrowserClient();
  supabase.auth.getUser().then(({data})=>{
   if(!active)return;
   if(!data.user){router.replace("/login?next=/dashboard");return}
   setEmail(data.user.email||"");
   setLoading(false);
  });
  return()=>{active=false};
 },[router]);
 const logout=async()=>{const supabase=createSupabaseBrowserClient();await supabase.auth.signOut();router.replace("/login")};
 if(loading)return <main className="member-dashboard"><div className="member-main"><div className="dashboard-panel loading-panel">Loading your account…</div></div></main>;
 const initials=(email.split("@")[0]||"U").slice(0,1).toUpperCase();
 return <main className="member-dashboard">
  <header className="member-header">
   <Link href="/dashboard" className="member-brand"><img src="/orbitex-logo.svg" alt="ORBITEX"/><span>ORBITEX</span><i>.</i></Link>
   <nav className="member-header-nav"><Link className="active" href="/dashboard">Dashboard</Link><Link href="/markets">Markets</Link><Link href="/trade">Spot</Link><Link href="/futures">Futures</Link><Link href="/wallet">Assets</Link><Link href="/orders">Orders</Link></nav>
   <div className="member-profile"><span className="member-email">{email}</span><span className="member-avatar">{initials}</span><button onClick={logout} aria-label="Log out" className="member-logout"><LogOut size={17}/></button></div>
  </header>

  <div className="member-main">
   <div className="member-welcome">
    <div><div className="eyebrow">TRADING ACCOUNT</div><h1>Welcome back</h1><p>Your trading dashboard, portfolio and market activity.</p></div>
    <div className="member-status"><i/> Account active</div>
   </div>

   <section className="member-balance">
    <div><div className="balance-kicker">Total account equity</div><h2>$0.00</h2><div className="balance-change neutral">No funds deposited yet</div></div>
    <div className="balance-split"><div><span>Spot wallet</span><strong>$0.00</strong></div><div><span>Futures wallet</span><strong>$0.00</strong></div></div>
   </section>

   <section className="dashboard-actions">
    <Link href="/trade" className="dashboard-action"><b className="action-icon"><TrendingUp size={20}/></b><strong>Trade Spot</strong><span>Buy and sell supported markets</span></Link>
    <Link href="/futures" className="dashboard-action"><b className="action-icon"><BarChart3 size={20}/></b><strong>Trade Futures</strong><span>Long, short and manage leverage</span></Link>
    <Link href="/markets" className="dashboard-action"><b className="action-icon"><Activity size={20}/></b><strong>Explore Markets</strong><span>View prices and market movement</span></Link>
    <Link href="/wallet" className="dashboard-action"><b className="action-icon"><WalletCards size={20}/></b><strong>View Assets</strong><span>Balances and account transactions</span></Link>
   </section>

   <div className="stats-grid">
    <section className="mini-stat"><span>Today's P&amp;L</span><strong>$0.00</strong><small>0.00%</small></section>
    <section className="mini-stat"><span>Open positions</span><strong>0</strong><small>Futures</small></section>
    <section className="mini-stat"><span>Open orders</span><strong>0</strong><small>Spot + Futures</small></section>
    <section className="mini-stat"><span>Account status</span><strong className="status-good">Active</strong><small>Authenticated</small></section>
   </div>

   <div className="dashboard-grid">
    <section className="dashboard-panel">
     <div className="panel-head"><h2>Portfolio</h2><Link href="/wallet">View assets →</Link></div>
     {assets.map(([symbol,amount,value])=><div className="portfolio-row" key={symbol}><CoinIcon symbol={symbol} size={36}/><div className="portfolio-name"><strong>{symbol}</strong><span>{amount} available</span></div><div className="portfolio-value"><strong>{value}</strong><span>Estimated value</span></div><span className="portfolio-pct">—</span></div>)}
    </section>
    <section className="dashboard-panel">
     <div className="panel-head"><h2>Market watch</h2><Link href="/markets">View all →</Link></div>
     {markets.map(([symbol,price,change])=><Link className="dashboard-market" href={`/trade?pair=${symbol}/USDT`} key={symbol}><CoinIcon symbol={symbol} size={36}/><div className="market-name"><strong>{symbol}/USDT</strong><span>Live market</span></div><div className="market-price"><strong>${price}</strong><span className={change.startsWith("-")?"down":"up"}>{change}</span></div></Link>)}
    </section>
   </div>

   <div className="dashboard-grid lower-grid">
    <section className="dashboard-panel">
     <div className="panel-head"><h2>Open positions</h2><Link href="/futures">Futures →</Link></div>
     <div className="activity-empty"><TrendingDown size={22}/><strong>No open positions</strong><span>Your futures positions will appear here after you place a trade.</span></div>
    </section>
    <section className="dashboard-panel">
     <div className="panel-head"><h2>Open orders</h2><Link href="/orders">View orders →</Link></div>
     <div className="activity-empty"><Clock3 size={22}/><strong>No open orders</strong><span>Limit and pending orders will appear here.</span></div>
    </section>
   </div>

   <section className="dashboard-panel activity-panel">
    <div className="panel-head"><h2>Recent trading activity</h2><Link href="/orders">Order history →</Link></div>
    <div className="activity-empty"><HistoryIcon/><strong>No trading activity yet</strong><span>Your completed trades, fills and order events will appear here.</span></div>
   </section>

   <section className="dashboard-security"><ShieldCheck size={18}/><div><strong>Account security</strong><span>Your session is authenticated. Additional security controls can be added before live trading.</span></div><Link href="/security">Security settings →</Link></section>
  </div>
  <MobileNav/>
 </main>
}

function HistoryIcon(){return <div className="history-icon"><ArrowLeftRight size={20}/></div>}
