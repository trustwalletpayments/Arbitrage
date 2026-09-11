"use client";
import {FormEvent,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowDownUp,CheckCircle2,WalletCards} from "lucide-react";
import {getTestnetBalances,setTestnetBalances,addTestnetTransaction} from "../../../lib/testnet-wallet";
import type {TestnetWallet,TestnetTransaction} from "../../../lib/testnet-wallet";
import "./transfer.css";

export default function Transfer(){
 const [done,setDone]=useState(false);const [amount,setAmount]=useState("");
 const [from,setFrom]=useState<"Spot wallet"|"Futures wallet">("Spot wallet");
 const [to,setTo]=useState<"Spot wallet"|"Futures wallet">("Futures wallet");
 const [error,setError]=useState("");const [balances,setBalances]=useState<TestnetWallet[]>([]);
 useEffect(()=>setBalances(getTestnetBalances()),[]);
 const usdt=useMemo(()=>balances.find(x=>x.asset==="USDT")||{spot:0,futures:0},[balances]);
 const available=from==="Spot wallet"?usdt.spot:usdt.futures;
 const swap=()=>{setFrom(to);setTo(from);setError("");setAmount("")};
 const submit=(e:FormEvent)=>{e.preventDefault();setError("");const n=Number(amount);
  if(from===to){setError("From and To wallets must be different.");return}
  if(!Number.isFinite(n)||n<=0){setError("Enter a valid amount.");return}
  if(n>available){setError(`Insufficient ${from.toLowerCase()} balance.`);return}
  const b=getTestnetBalances();const source=from==="Spot wallet"?"spot":"futures";const target=to==="Spot wallet"?"spot":"futures";const wallet=b.find(x=>x.asset==="USDT");
  if(!wallet||wallet[source]<n){setError(`Insufficient ${from.toLowerCase()} balance.`);return}
  wallet[source]-=n;wallet[target]+=n;setTestnetBalances(b);
  const tx:TestnetTransaction={id:crypto.randomUUID(),type:"TRANSFER",asset:"USDT",amount:n,wallet:target.toUpperCase() as "SPOT"|"FUTURES",status:"COMPLETED",createdAt:new Date().toISOString(),note:`${from} → ${to}`};
  addTestnetTransaction(tx);setBalances(b);setDone(true);
 };
 if(done)return <main className="transfer-page"><div className="transfer-top"><Link href="/wallet"><ArrowLeft size={21}/></Link><span>Transfer</span><span/></div><section className="transfer-success"><div className="success-icon"><CheckCircle2/></div><div className="transfer-eyebrow">TRANSFER COMPLETE</div><h1>{Number(amount).toFixed(2)} USDT</h1><p>Transferred from <strong>{from.replace(" wallet","")}</strong> to <strong>{to.replace(" wallet","")}</strong>.</p><div className="success-route"><span>{from.replace(" wallet","")}</span><ArrowDownUp size={18}/><span>{to.replace(" wallet","")}</span></div><Link className="transfer-primary" href="/wallet">Back to Assets</Link></section></main>;
 return <main className="transfer-page"><div className="transfer-top"><Link href="/wallet"><ArrowLeft size={21}/></Link><span>Transfer</span><span/></div><div className="transfer-wrap"><div className="transfer-heading"><div className="transfer-icon"><WalletCards/></div><div><div className="transfer-eyebrow">INTERNAL TRANSFER</div><h1>Move balance</h1><p>Move USDT instantly between your Spot and Futures wallets.</p></div></div><section className="transfer-card"><div className="wallet-box"><label>From</label><div className="wallet-choice"><span><b>USDT</b><small>{from}</small></span><strong>{available.toFixed(2)} USDT</strong></div></div><button className="swap-transfer" type="button" onClick={swap} aria-label="Swap transfer direction"><ArrowDownUp size={19}/></button><div className="wallet-box"><label>To</label><div className="wallet-choice"><span><b>USDT</b><small>{to}</small></span><strong>{(to==="Spot wallet"?usdt.spot:usdt.futures).toFixed(2)} USDT</strong></div></div><form onSubmit={submit}><div className="amount-head"><label>Amount</label><button type="button" onClick={()=>setAmount(available.toString())}>MAX</button></div><div className="amount-input"><input required min="0" type="number" step="any" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/><span>USDT</span></div><div className="quick-amounts"><button type="button" onClick={()=>setAmount((available*.25).toFixed(2))}>25%</button><button type="button" onClick={()=>setAmount((available*.5).toFixed(2))}>50%</button><button type="button" onClick={()=>setAmount((available*.75).toFixed(2))}>75%</button><button type="button" onClick={()=>setAmount(available.toString())}>100%</button></div>{error&&<div className="transfer-error">{error}</div>}<button className="transfer-primary full" type="submit">Transfer {amount?`${amount} USDT`:"USDT"}</button></form><div className="transfer-note">No network fee · Internal wallet transfer · Testnet mode</div></section></div></main>
}
