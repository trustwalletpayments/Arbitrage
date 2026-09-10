"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowDownToLine,ArrowUpFromLine,ArrowLeftRight,History,Eye,ChevronRight} from "lucide-react";
import {getTestnetBalances,getTestnetTransactions,TestnetTransaction} from "../../lib/testnet-wallet";
import MobileNav from "../components/MobileNav";

export default function Wallet(){
 const [balances,setBalances]=useState(getTestnetBalances());const [tx,setTx]=useState<TestnetTransaction[]>([]);
 function refresh(){setBalances(getTestnetBalances());setTx(getTestnetTransactions())}
 useEffect(()=>{refresh()},[]);
 const total=useMemo(()=>balances.reduce((sum,x)=>sum+x.spot+x.futures,0),[balances]);
 return <main className="exchange-mobile app-shell">
  <header className="mobile-simple-head"><Link href="/dashboard">‹</Link><h1>Assets</h1><Link href="/wallet/history"><History size={21}/></Link></header>
  <div className="asset-tabs"><Link href="/wallet">Overview</Link><Link className="active" href="/wallet">Spot</Link><Link href="/wallet">Funding</Link><Link href="/futures">Futures</Link></div>
  <section className="asset-total"><div>Est. Total Value <Eye size={17}/></div><strong>₹{total.toFixed(2)}</strong><span>Today's PNL <b>+₹0.00 (+0.00%)</b></span></section>
  <section className="asset-actions"><Link href="/wallet/deposit"><span><ArrowDownToLine/></span>Add Funds</Link><Link href="/wallet/withdraw"><span><ArrowUpFromLine/></span>Send</Link><Link href="/wallet/transfer"><span><ArrowLeftRight/></span>Transfer</Link></section>
  <section className="asset-card"><div className="asset-card-head"><strong>Crypto</strong><button onClick={refresh}>↻</button></div>{balances.map(a=><div className="asset-item" key={a.asset}><div className="coin-icon usdt">{a.asset[0]}</div><div className="asset-name"><strong>{a.asset}</strong><span>{a.asset==="USDT"?"TetherUS":a.asset}</span></div><div className="asset-amount"><strong>{a.spot.toFixed(a.asset==="USDT"?8:4)}</strong><span>₹{(a.asset==="USDT"?a.spot:a.spot).toFixed(2)}</span></div><ChevronRight size={18}/></div>)}</section>
  <section className="wallet-links"><Link href="/wallet/deposit">Deposit</Link><Link href="/wallet/withdraw">Withdraw</Link><Link href="/wallet/transfer">Transfer</Link></section>
  {tx.length>0&&<section className="asset-card transactions"><div className="asset-card-head"><strong>Recent activity</strong><Link href="/wallet/history">View all</Link></div>{tx.slice(0,4).map(t=><div className="tx-item" key={t.id}><div><strong>{t.type}</strong><span>{t.symbol||t.wallet}</span></div><div><strong>{t.amount.toFixed(4)} {t.asset}</strong><span>{t.status}</span></div></div>)}</section>}
  <MobileNav/>
 </main>
}
