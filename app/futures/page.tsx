"use client";
import {useState} from "react";
import Link from "next/link";
import {addTestnetPosition} from "../../lib/testnet-store";
const referencePrice=113842.20;
export default function Futures(){
  const [side,setSide]=useState("Long");
  const [lev,setLev]=useState(10);
  const [orderType,setOrderType]=useState("Limit");
  const [entryPrice,setEntryPrice]=useState(String(referencePrice));
  const [quantity,setQuantity]=useState("");
  const [takeProfit,setTakeProfit]=useState("");
  const [stopLoss,setStopLoss]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [message,setMessage]=useState("");
  async function submit(){
    setMessage("");
    const entry=orderType==="Market"?referencePrice:Number(entryPrice);
    const qty=Number(quantity);
    if(!Number.isFinite(entry)||entry<=0||!Number.isFinite(qty)||qty<=0){setMessage("Enter a valid entry price and quantity.");return}
    setSubmitting(true);
    try{
      const res=await fetch("/api/testnet/futures",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({symbol:"BTC/USDT",side:side.toUpperCase(),entryPrice:entry,markPrice:referencePrice,quantity:qty,leverage:lev,takeProfit:takeProfit?Number(takeProfit):undefined,stopLoss:stopLoss?Number(stopLoss):undefined})});
      const data=await res.json();
      if(!res.ok||!data.ok)throw new Error(data.error||"Position rejected");
      addTestnetPosition(data.position);
      setMessage(`Testnet ${data.position.side} position created · Margin ${data.position.margin.toFixed(2)} USDT · Est. liquidation ${data.position.liquidationPrice.toFixed(2)}`);
      setQuantity("");
    }catch(error){setMessage(error instanceof Error?error.message:"Position failed")}finally{setSubmitting(false)}
  }
  return <main className="app-shell"><header className="appbar"><Link className="brand" href="/">ARBITRAGE<span>.</span></Link><nav><Link href="/dashboard">Dashboard</Link><Link href="/trade">Spot</Link><Link className="active" href="/futures">Futures</Link><Link href="/wallet">Wallet</Link><Link href="/orders">Orders</Link></nav><Link className="btn" href="/">Account</Link></header><div className="futures-wrap"><div className="trade-head"><div><div className="pair">BTC/USDT Perpetual</div><div className="price">113,842.20 <span className="up">+2.14%</span></div><div className="muted tiny">Testnet reference mark price</div></div><div className="leverage">Leverage <select value={lev} onChange={e=>setLev(Number(e.target.value))}>{[1,2,3,5,10,20,50,100].map(x=><option key={x} value={x}>{x}x</option>)}</select></div></div><div className="futures-grid"><div className="chart"><div className="chart-grid"></div><div className="chart-line">╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱</div><span>Futures chart · live market data will be connected later</span></div><div className="order-panel"><div className="tabs"><button className={side==="Long"?"on":""} onClick={()=>setSide("Long")}>Long</button><button className={side==="Short"?"on":""} onClick={()=>setSide("Short")}>Short</button></div><label>Order type<select value={orderType} onChange={e=>setOrderType(e.target.value)}><option>Limit</option><option>Market</option></select></label><label>Entry price<input value={entryPrice} disabled={orderType==="Market"} onChange={e=>setEntryPrice(e.target.value)} placeholder="USDT"/></label><label>Quantity<input value={quantity} onChange={e=>setQuantity(e.target.value)} inputMode="decimal" placeholder="BTC"/></label><div className="two-input"><label>Take profit<input value={takeProfit} onChange={e=>setTakeProfit(e.target.value)} placeholder="Optional"/></label><label>Stop loss<input value={stopLoss} onChange={e=>setStopLoss(e.target.value)} placeholder="Optional"/></label></div><div className="order-info"><span>Available margin</span><span>2,620.00 USDT</span></div>{message&&<div className="notice">{message}</div>}<button className="btn primary full" disabled={submitting} onClick={submit}>{submitting?"Opening…":`${side} BTC`}</button><p className="muted tiny">Leverage: {lev}x · Testnet only. No real position or funds are opened.</p><Link className="muted tiny" href="/orders">View testnet positions →</Link></div></div></div></main>}
