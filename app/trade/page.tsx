"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {addTestnetOrder} from "../../lib/testnet-store";
const markets=["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT","DOGE/USDT"];
const referencePrice=113842.20;
export default function Trade(){
  const [pair,setPair]=useState("BTC/USDT");
  const [side,setSide]=useState("Buy");
  const [type,setType]=useState("Limit");
  const [price,setPrice]=useState(String(referencePrice));
  const [amount,setAmount]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [message,setMessage]=useState("");
  const size=useMemo(()=>{const p=Number(price);const q=Number(amount);return p>0&&q>0?(p*q).toFixed(2):"0.00"},[price,amount]);
  async function submit(){
    setMessage("");
    const orderPrice=type==="Market"?referencePrice:Number(price);
    if(!Number.isFinite(orderPrice)||orderPrice<=0||!Number.isFinite(Number(amount))||Number(amount)<=0){setMessage("Enter a valid price and amount.");return}
    setSubmitting(true);
    try{
      const res=await fetch("/api/testnet/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({symbol:pair,side:side.toUpperCase(),type:type.toUpperCase(),price:orderPrice,quantity:Number(amount)})});
      const data=await res.json();
      if(!res.ok||!data.ok)throw new Error(data.error||"Order rejected");
      addTestnetOrder(data.order);
      setMessage(`Testnet order filled: ${data.order.side} ${data.order.quantity} ${pair.split("/")[0]}`);
      setAmount("");
    }catch(error){setMessage(error instanceof Error?error.message:"Order failed")}finally{setSubmitting(false)}
  }
  return <main className="app-shell"><header className="appbar"><Link className="brand" href="/">ARBITRAGE<span>.</span></Link><nav><Link href="/dashboard">Dashboard</Link><Link className="active" href="/trade">Spot</Link><Link href="/futures">Futures</Link><Link href="/wallet">Wallet</Link><Link href="/orders">Orders</Link></nav><Link className="btn" href="/">Account</Link></header><div className="trade-layout"><aside className="market-list"><div className="label">MARKETS</div>{markets.map(m=><button className={m===pair?"selected":""} onClick={()=>setPair(m)} key={m}><span>{m}</span><small>+1.82%</small></button>)}</aside><section className="chart-area"><div className="trade-head"><div><div className="pair">{pair}</div><div className="price">113,842.20 <span className="up">+2.14%</span></div><div className="muted tiny">Testnet reference price</div></div><Link className="btn" href="/futures">Open Futures</Link></div><div className="chart"><div className="chart-grid"></div><div className="chart-line">╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱</div><span>Chart area · live feed will be connected later</span></div></section><section className="order-panel"><div className="tabs"><button className={side==="Buy"?"on":""} onClick={()=>setSide("Buy")}>Buy</button><button className={side==="Sell"?"on":""} onClick={()=>setSide("Sell")}>Sell</button></div><div className="order-types">{["Limit","Market"].map(t=><button className={type===t?"on":""} onClick={()=>setType(t)} key={t}>{t}</button>)}</div><label>Price<input value={price} disabled={type==="Market"} onChange={e=>setPrice(e.target.value)} placeholder="USDT"/></label><label>Amount<input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" placeholder="0.00"/></label><label>Size<input value={`${size} USDT`} readOnly/></label><div className="order-info"><span>Available</span><span>9,860.32 USDT</span></div>{message&&<div className="notice">{message}</div>}<button className="btn primary full" disabled={submitting} onClick={submit}>{submitting?"Submitting…":`${side} ${pair.split("/")[0]}`}</button><p className="muted tiny">Testnet only. No real funds or market orders are submitted.</p><Link className="muted tiny" href="/orders">View testnet order history →</Link></section></div></main>}
