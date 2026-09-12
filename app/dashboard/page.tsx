"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Activity,ArrowDownToLine,ArrowLeftRight,ArrowUpFromLine,BarChart3,ChevronRight,Clock3,Eye,EyeOff,LogOut,MoreHorizontal,Plus,ShieldCheck,WalletCards} from "lucide-react";
import {useRouter} from "next/navigation";
import MobileNav from "../components/MobileNav";
import CoinIcon from "../components/CoinIcon";
import {createSupabaseBrowserClient} from "../lib/supabase-browser";
import "./dashboard.css";

const markets=[["BTC","77,154.49","+2.32%"],["ETH","3,661.27","+1.48%"],["SOL","147.62","+4.21%"],["BNB","712.34","-3.85%"],["XRP","2.81","+0.92%"]] as const;
const assets=[["USDT","0.00","$0.00"],["BTC","0.00000000","$0.00"],["ETH","0.00000000","$0.00"],["SOL","0.00000000","$0.00"]] as const;

export default function Dashboard(){
 const router=useRouter();
 const [email,setEmail]=useState("");
 const [loading,setLoading]=useState(true);
 const [hidden,setHidden]=useState(false);
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
 if(loading)return <main className="member-dashboard"><div className="dashboard-loading">Loading your account…</div></main>;
 const initials=(email.split("@")[0]||"U").slice(0,1).toUpperCase();
 const money=hidden?"••••••":"$0.00";
 return <main className="member-dashboard">
  <header className="member-header">
   <Link href="/dashboard" className="member-brand"><img src="/orbitex-logo.svg" alt="ORBITEX"/><span>ORBITEX</span></Link>
   <nav className="member-header-nav"><Link className="active" href="/dashboard">Overview</Link><Link href="/trade">Spot</Link><Link href="/wallet">Funding</Link><Link href="/futures">Futures</Link></nav>
   <div className="member-profile"><span className="member-email">{email}</span><span className="member-avatar">{initials}</span><button onClick={logout} aria-label="Log out" className="member-logout"><LogOut size={17}/></button></div>
  </header>

  <div className="member-main">
   <section className="account-top">
    <div className="account-title"><div className="eyebrow">ACCOUNT OVERVIEW</div><h1>Good to see you</h1></div>
    <button className="more-button" aria-label="More options"><MoreHorizontal size={21}/></button>
   </section>

   <section className="hero-balance">
    <div className="balance-heading"><span>Estimated total value</span><button onClick={()=>setHidden(!hidden)} aria-label={hidden?"Show balance":"Hide balance"}>{hidden?<EyeOff size={20}/>:<Eye size={20}/>}</button></div>
    <div className="balance-number">{money} <small>USD <ChevronRight size={16}/></small></div>
    <div className="pnl-line"><span>Today's P&amp;L</span><strong>+$0.00 (+0.00%)</strong><ChevronRight size={17}/></div>
    <div className="hero-curve"><span/><i/><b/></div>
   </section>

   <section className="quick-actions" aria-label="Account actions">
    <Link href="/wallet" className="quick-action"><div className="quick-icon add-icon"><ArrowDownToLine size={25}/></div><b>Add funds</b></Link>
    <Link href="/wallet" className="quick-action"><div className="quick-icon send-icon"><ArrowUpFromLine size={25}/></div><b>Send</b></Link>
    <Link href="/wallet" className="quick-action"><div className="quick-icon transfer-icon"><ArrowLeftRight size={25}/></div><b>Transfer</b></Link>
    <Link href="/trade" className="quick-action"><div className="quick-icon trade-icon"><BarChart3 size={25}/></div><b>Trade</b></Link>
   </section>

   <section className="market-highlight">
    <div className="section-heading"><div><span>Markets</span><strong>Trending now</strong></div><Link href="/markets">See all <ChevronRight size={16}/></Link></div>
    <div className="market-strip">{markets.slice(0,3).map(([symbol,price,change])=><Link href={`/trade?pair=${symbol}/USDT`} className="market-chip" key={symbol}><div><CoinIcon symbol={symbol} size={30}/><span>{symbol}/USDT</span></div><strong>${price}</strong><em className={change.startsWith("-")?"down":"up"}>{change}</em></Link>)}</div>
   </section>

   <div className="content-grid">
    <section className="asset-card">
     <div className="section-heading"><div><span>Portfolio</span><strong>Your assets</strong></div><Link href="/wallet">View all <ChevronRight size={16}/></Link></div>
     <div className="asset-total"><span>Total balance</span><strong>{money}</strong></div>
     {assets.map(([symbol,amount,value])=><div className="asset-row" key={symbol}><CoinIcon symbol={symbol} size={38}/><div className="asset-name"><strong>{symbol}</strong><span>{amount} available</span></div><div className="asset-value"><strong>{hidden?"••••":value}</strong><span>USD</span></div></div>)}
    </section>

    <section className="activity-card">
     <div className="section-heading"><div><span>Activity</span><strong>Recent activity</strong></div><Link href="/orders">View all <ChevronRight size={16}/></Link></div>
     <div className="empty-activity"><div className="empty-icon"><Clock3 size={20}/></div><strong>No activity yet</strong><span>Your completed orders and transactions will appear here.</span><Link href="/markets">Explore markets</Link></div>
    </section>
   </div>

   <section className="product-row">
    <Link href="/trade" className="product-card"><span className="product-icon"><Plus size={20}/></span><div><strong>Spot trading</strong><span>Trade crypto with live prices and charts.</span></div><ChevronRight/></Link>
    <Link href="/futures" className="product-card"><span className="product-icon"><Activity size={20}/></span><div><strong>Futures</strong><span>Long, short and manage leverage.</span></div><ChevronRight/></Link>
   </section>

   <section className="security-strip"><ShieldCheck size={19}/><div><strong>Account security</strong><span>Authenticated session • Keep your credentials private.</span></div><Link href="/security">Manage</Link></section>
  </div>
  <MobileNav/>
 </main>
}