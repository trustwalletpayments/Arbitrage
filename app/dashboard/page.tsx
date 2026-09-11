"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Search,ArrowDownToLine,ArrowUpFromLine,ArrowLeftRight,TrendingUp,ShieldCheck,History,ReceiptText,LogOut} from "lucide-react";
import {useRouter} from "next/navigation";
import MobileNav from "../components/MobileNav";
import CoinIcon from "../components/CoinIcon";
import {createSupabaseBrowserClient} from "../lib/supabase-browser";
import "./dashboard.css";

const assets=[["USDT","63.61196792","₹6,079.39"],["BTC","0.0842","₹5,245.12"],["ETH","1.72","₹4,106.80"],["SOL","14.80","₹2,982.44"]] as const;
const markets=[["BTC","77,154.49","+2.32%"],["ETH","3,661.27","+1.48%"],["SOL","147.62","+4.21%"],["BNB","712.34","-3.85%"]] as const;

export default function Dashboard(){
 const router=useRouter(); const [email,setEmail]=useState(""); const [loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;const supabase=createSupabaseBrowserClient();supabase.auth.getUser().then(({data})=>{if(!active)return;if(!data.user){router.replace("/login?next=/dashboard");return}setEmail(data.user.email||"");setLoading(false)});return()=>{active=false}},[router]);
 const logout=async()=>{const supabase=createSupabaseBrowserClient();await supabase.auth.signOut();router.replace("/login")};
 if(loading)return <main className="member-dashboard"><div className="member-main"><div className="dashboard-panel" style={{padding:32,color:"#8996a8"}}>Loading your account…</div></div></main>;
 const initials=(email.split("@")[0]||"U").slice(0,1).toUpperCase();
 return <main className="member-dashboard">
  <header className="member-header"><Link href="/dashboard" className="member-brand"><img src="/orbitex-logo.svg" alt="ORBITEX"/><span>ORBITEX</span><i>.</i></Link><nav className="member-header-nav"><Link className="active" href="/dashboard">Dashboard</Link><Link href="/markets">Markets</Link><Link href="/trade">Spot</Link><Link href="/futures">Futures</Link><Link href="/wallet">Wallet</Link><Link href="/orders">Orders</Link></nav><div className="member-profile"><span className="member-email">{email}</span><span className="member-avatar">{initials}</span><button onClick={logout} aria-label="Log out" className="member-logout"><LogOut size={17}/></button></div></header>
  <div className="member-main">
   <div className="member-welcome"><div><div className="eyebrow">MEMBER DASHBOARD</div><h1>Welcome back</h1><p>Your account overview and latest market activity.</p></div><div className="member-status"><i/> Account active</div></div>
   <section className="member-balance"><div><div className="balance-kicker">Estimated total balance</div><h2>₹6,079.39</h2><div className="balance-change">+₹0.00 <span>(0.00% today)</span></div></div><div className="balance-buttons"><Link href="/wallet/deposit" className="primary">Deposit</Link><Link href="/wallet/withdraw" className="secondary">Withdraw</Link></div></section>
   <section className="dashboard-actions"><Link href="/wallet/deposit" className="dashboard-action"><b className="action-icon"><ArrowDownToLine size={20}/></b><strong>Deposit</strong><span>Add crypto to your account</span></Link><Link href="/wallet/withdraw" className="dashboard-action"><b className="action-icon"><ArrowUpFromLine size={20}/></b><strong>Withdraw</strong><span>Send crypto securely</span></Link><Link href="/wallet/transfer" className="dashboard-action"><b className="action-icon"><ArrowLeftRight size={20}/></b><strong>Transfer</strong><span>Move between wallets</span></Link><Link href="/trade" className="dashboard-action"><b className="action-icon"><TrendingUp size={20}/></b><strong>Start trading</strong><span>Spot markets and orders</span></Link></section>
   <div className="dashboard-grid"><section className="dashboard-panel"><div className="panel-head"><h2>Your portfolio</h2><Link href="/wallet">View wallet →</Link></div>{assets.map(([symbol,amount,value])=><div className="portfolio-row" key={symbol}><CoinIcon symbol={symbol} size={36}/><div className="portfolio-name"><strong>{symbol}</strong><span>{amount} available</span></div><div className="portfolio-value"><strong>{value}</strong><span>Estimated value</span></div><span className="portfolio-pct">—</span></div>)}</section><section className="dashboard-panel"><div className="panel-head"><h2>Market watch</h2><Link href="/markets">View all →</Link></div>{markets.map(([symbol,price,change])=><Link className="dashboard-market" href={`/trade?pair=${symbol}/USDT`} key={symbol}><CoinIcon symbol={symbol} size={36}/><div className="market-name"><strong>{symbol}/USDT</strong><span>USDT market</span></div><div className="market-price"><strong>${price}</strong><span className={change.startsWith("-")?"down":"up"}>{change}</span></div></Link>)}</section></div>
   <section className="dashboard-panel" style={{marginTop:18}}><div className="panel-head"><h2>Recent activity</h2><Link href="/wallet/history">View history →</Link></div><div className="activity-empty"><History size={22} style={{marginBottom:8}}/><div>No recent transactions yet.</div><span>Your deposits, withdrawals and transfers will appear here.</span></div></section>
   <section className="dashboard-security"><ShieldCheck size={18}/><div><strong>Account security</strong><span>Keep your login details private and enable additional account protection when available.</span></div><Link href="/security">Security settings →</Link></section>
  </div><MobileNav/>
 </main>
}
