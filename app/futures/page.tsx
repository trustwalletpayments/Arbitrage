"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {addTestnetPosition,getTestnetPositions,updateTestnetPosition} from "../../lib/testnet-store";
import type {StoredPosition} from "../../lib/testnet-store";

const referencePrice=113842.20;
const WS_URL="wss://fstream.binance.com/ws/btcusdt@markPrice@1s";
const KLINE_URL="wss://fstream.binance.com/ws/btcusdt@kline_1m";

export default function Futures(){
  const [side,setSide]=useState("Long");
  const [lev,setLev]=useState(10);
  const [orderType,setOrderType]=useState("Limit");
  const [entryPrice,setEntryPrice]=useState(String(referencePrice));
  const [quantity,setQuantity]=useState("");
  const [takeProfit,setTakeProfit]=useState("");
  const [stopLoss,setStopLoss]=useState("");
  const [markPrice,setMarkPrice]=useState(referencePrice);
  const [chartPrices,setChartPrices]=useState<number[]>([]);
  const [positions,setPositions]=useState<StoredPosition[]>([]);
  const [submitting,setSubmitting]=useState(false);
  const [message,setMessage]=useState("");

  useEffect(()=>{
    setPositions(getTestnetPositions());
    const markSocket=new WebSocket(WS_URL);
    const klineSocket=new WebSocket(KLINE_URL);
    markSocket.onmessage=(event)=>{
      try{
        const data=JSON.parse(event.data);
        const next=Number(data.p);
        if(!Number.isFinite(next)||next<=0)return;
        setMarkPrice(next);
        setPositions(current=>{
          const nextPositions=current.map(position=>{
            if(position.status&&position.status!=="OPEN")return position;
            const pnl=(position.side==="LONG"?next-position.entryPrice:position.entryPrice-next)*position.quantity;
            let status:StoredPosition["status"]="OPEN";
            if(position.side==="LONG"&&position.takeProfit&&next>=position.takeProfit)status="TP HIT";
            if(position.side==="LONG"&&position.stopLoss&&next<=position.stopLoss)status="SL HIT";
            if(position.side==="SHORT"&&position.takeProfit&&next<=position.takeProfit)status="TP HIT";
            if(position.side==="SHORT"&&position.stopLoss&&next>=position.stopLoss)status="SL HIT";
            if(next<=(position.side==="LONG"?position.liquidationPrice:-Infinity)||next>=(position.side==="SHORT"?position.liquidationPrice:Infinity))status="LIQUIDATED";
            const updated={...position,markPrice:next,unrealizedPnl:pnl,status};
            if(status!=="OPEN"||next!==position.markPrice)updateTestnetPosition(position.id,{markPrice:next,unrealizedPnl:pnl,status});
            return updated;
          });
          return nextPositions;
        });
      }catch{}
    };
    klineSocket.onmessage=(event)=>{
      try{
        const data=JSON.parse(event.data);
        const close=Number(data.k?.c);
        if(Number.isFinite(close)&&close>0)setChartPrices(current=>[...current,close].slice(-40));
      }catch{}
    };
    return()=>{markSocket.close();klineSocket.close()};
  },[]);

  const livePnl=useMemo(()=>{
    const entry=Number(entryPrice),qty=Number(quantity);
    if(!Number.isFinite(entry)||entry<=0||!Number.isFinite(qty)||qty<=0)return 0;
    return (side==="Long"?markPrice-entry:entry-markPrice)*qty;
  },[entryPrice,quantity,side,markPrice]);

  async function submit(){
    setMessage("");
    const entry=orderType==="Market"?markPrice:Number(entryPrice);
    const qty=Number(quantity);
    if(!Number.isFinite(entry)||entry<=0||!Number.isFinite(qty)||qty<=0){setMessage("Enter a valid entry price and quantity.");return}
    if(takeProfit&&(!Number.isFinite(Number(takeProfit))||Number(takeProfit)<=0)){setMessage("Enter a valid take-profit price.");return}
    if(stopLoss&&(!Number.isFinite(Number(stopLoss))||Number(stopLoss)<=0)){setMessage("Enter a valid stop-loss price.");return}
    setSubmitting(true);
    try{
      const res=await fetch("/api/testnet/futures",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({symbol:"BTC/USDT",side:side.toUpperCase(),entryPrice:entry,markPrice,quantity:qty,leverage:lev,takeProfit:takeProfit?Number(takeProfit):undefined,stopLoss:stopLoss?Number(stopLoss):undefined})});
      const data=await res.json();
      if(!res.ok||!data.ok)throw new Error(data.error||"Position rejected");
      addTestnetPosition(data.position);
      setPositions(current=>[data.position,...current]);
      setMessage(`Testnet ${data.position.side} position created · Margin ${data.position.margin.toFixed(2)} USDT · Est. liquidation ${data.position.liquidationPrice.toFixed(2)}`);
      setQuantity("");
    }catch(error){setMessage(error instanceof Error?error.message:"Position failed")}finally{setSubmitting(false)}
  }

  const chartPath=chartPrices.length>1?chartPrices.map((value,index)=>{const min=Math.min(...chartPrices),max=Math.max(...chartPrices),x=(index/(chartPrices.length-1))*100,y=max===min?50:95-((value-min)/(max-min))*90;return `${index===0?"M":"L"} ${x.toFixed(2)} ${y.toFixed(2)}`}).join(" "):"M 0 50 L 100 50";

  return <main className="app-shell"><header className="appbar"><Link className="brand" href="/">ARBITRAGE<span>.</span></Link><nav><Link href="/dashboard">Dashboard</Link><Link href="/trade">Spot</Link><Link className="active" href="/futures">Futures</Link><Link href="/wallet">Wallet</Link><Link href="/orders">Orders</Link></nav><Link className="btn" href="/">Account</Link></header><div className="futures-wrap"><div className="trade-head"><div><div className="pair">BTC/USDT Perpetual</div><div className="price">{markPrice.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} <span className="up">LIVE</span></div><div className="muted tiny">Binance public futures mark-price feed · testnet trading engine</div></div><div className="leverage">Leverage <select value={lev} onChange={e=>setLev(Number(e.target.value))}>{[1,2,3,5,10,20,50,100].map(x=><option key={x} value={x}>{x}x</option>)}</select></div></div><div className="futures-grid"><div><div className="chart"><div className="chart-grid"></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{width:"100%",height:"100%",position:"absolute",inset:0,padding:"20px"}}><path d={chartPath} fill="none" stroke="currentColor" strokeWidth="1.4" vectorEffect="non-scaling-stroke"/></svg><span>1m live BTC/USDT candles · {chartPrices.length} updates</span></div><div className="panel" style={{marginTop:18}}><div className="trade-head"><strong>Open testnet positions</strong><span className="muted">{positions.filter(p=>p.status!=="TP HIT"&&p.status!=="SL HIT"&&p.status!=="LIQUIDATED").length} open</span></div>{positions.length===0?<p className="muted tiny">No positions yet.</p>:<div className="market-list" style={{border:0,padding:"8px 0 0"}}>{positions.slice(0,4).map(p=><div key={p.id} className="asset-row"><div><strong>{p.side} {p.quantity} BTC</strong><div className="muted tiny">Entry {p.entryPrice.toFixed(2)} · Mark {p.markPrice.toFixed(2)}</div></div><div style={{textAlign:"right"}}><strong>{p.unrealizedPnl.toFixed(2)} USDT</strong><div className="muted tiny">{p.status||"OPEN"}</div></div></div>)}</div>}</div></div><div className="order-panel"><div className="tabs"><button className={side==="Long"?"on":""} onClick={()=>setSide("Long")}>Long</button><button className={side==="Short"?"on":""} onClick={()=>setSide("Short")}>Short</button></div><label>Order type<select value={orderType} onChange={e=>setOrderType(e.target.value)}><option>Limit</option><option>Market</option></select></label><label>Entry price<input value={entryPrice} disabled={orderType==="Market"} onChange={e=>setEntryPrice(e.target.value)} placeholder="USDT"/></label><label>Quantity<input value={quantity} onChange={e=>setQuantity(e.target.value)} inputMode="decimal" placeholder="BTC"/></label><div className="two-input"><label>Take profit<input value={takeProfit} onChange={e=>setTakeProfit(e.target.value)} placeholder="Optional"/></label><label>Stop loss<input value={stopLoss} onChange={e=>setStopLoss(e.target.value)} placeholder="Optional"/></label></div><div className="order-info"><span>Live mark</span><span>{markPrice.toFixed(2)} USDT</span></div><div className="order-info"><span>Live P&amp;L preview</span><strong>{livePnl.toFixed(2)} USDT</strong></div>{message&&<div className="notice">{message}</div>}<button className="btn primary full" disabled={submitting} onClick={submit}>{submitting?"Opening…":`${side} BTC`}</button><p className="muted tiny">{lev}x leverage · TP/SL monitoring is active while this page is open. Testnet only.</p><Link className="muted tiny" href="/orders">View all testnet positions →</Link></div></div></div></main>
}
