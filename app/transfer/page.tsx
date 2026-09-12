"use client";
import {useState} from "react";
import Link from "next/link";
import {ArrowLeftRight,ChevronLeft} from "lucide-react";
import {getTestnetBalances,setTestnetBalances} from "../../lib/testnet-wallet";
import "../auth.css";

export default function TransferPage(){
 const [from,setFrom]=useState<"SPOT"|"FUTURES">("SPOT");
 const [amount,setAmount]=useState("");
 const [message,setMessage]=useState("");
 const submit=()=>{
  const value=Number(amount);
  if(!Number.isFinite(value)||value<=0){setMessage("Enter a valid amount.");return}
  const balances=getTestnetBalances();
  const usdt=balances.find(x=>x.asset==="USDT");
  if(!usdt){setMessage("USDT balance is unavailable.");return}
  const source=from==="SPOT"?usdt.spot:usdt.futures;
  if(source<value){setMessage(`Insufficient USDT in your ${from.toLowerCase()} wallet.`);return}
  if(from==="SPOT"){usdt.spot-=value;usdt.futures+=value}else{usdt.futures-=value;usdt.spot+=value}
  setTestnetBalances(balances);setAmount("");setMessage(`Transferred ${value.toFixed(2)} USDT from ${from.toLowerCase()} to ${from==="SPOT"?"futures":"spot"} wallet.`)
 };
 return <main className="auth-page"><div className="auth-card" style={{maxWidth:520}}><Link href="/dashboard" className="auth-foot"><ChevronLeft size={16}/> Back to dashboard</Link><div className="eyebrow">WALLET TRANSFER</div><h1>Transfer balance</h1><p className="muted">Move testnet USDT between your Spot and Futures wallets.</p><div style={{display:"grid",gap:14,marginTop:24}}><label>From<select value={from} onChange={e=>setFrom(e.target.value as "SPOT"|"FUTURES")}><option value="SPOT">Spot wallet</option><option value="FUTURES">Futures wallet</option></select></label><div className="auth-input"><ArrowLeftRight/><input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount in USDT"/></div><button className="btn primary full" onClick={submit}>Transfer balance <span>→</span></button>{message&&<div className="notice">{message}</div>}</div><p className="muted" style={{marginTop:20,fontSize:12}}>Testnet mode only. No real funds are moved.</p></div></main>
}
