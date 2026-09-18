"use client";

import {useEffect,useMemo,useState} from "react";

type Props={pair:string;livePrice:number;change:number;available:number};
type Trade={price:number;amount:number;time:number;side:"buy"|"sell"};

export default function SpotEnhancements({pair,livePrice,change,available}:Props){
  const [tab,setTab]=useState<"book"|"trades">("book");
  const [ordersTab,setOrdersTab]=useState<"open"|"history">("open");
  const [filter,setFilter]=useState<"All"|"Favorites"|"Gainers"|"Losers">("All");
  const [allocation,setAllocation]=useState(0);
  const [favorite,setFavorite]=useState(false);
  const [recentTrades,setRecentTrades]=useState<Trade[]>([]);
  const base=pair.split("/")[0];
  const symbol=pair.replace("/","").toLowerCase();
  const price=livePrice||0;

  const rows=useMemo(()=>[0.998,0.997,0.996,0.995].map((factor,index)=>({price:price?price*factor:0,amount:[0.042,0.018,0.031,0.025][index]})),[price]);
  const buyRows=useMemo(()=>[1.000,0.999,0.998,0.997].map((factor,index)=>({price:price?price*factor:0,amount:[0.025,0.047,0.019,0.034][index]})),[price]);

  useEffect(()=>{
    setRecentTrades([]);
    let cancelled=false;
    let ws:WebSocket|undefined;
    const seed=async()=>{
      try{
        const response=await fetch(`https://api.binance.com/api/v3/trades?symbol=${symbol.toUpperCase()}&limit=20`);
        if(!response.ok)return;
        const data=await response.json();
        if(cancelled)return;
        setRecentTrades(data.map((t:any)=>({price:Number(t.price),amount:Number(t.qty),time:Number(t.time),side:t.isBuyerMaker?"sell":"buy"})).reverse());
      }catch{}
    };
    seed();
    try{
      ws=new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
      ws.onmessage=(event)=>{
        try{
          const t=JSON.parse(event.data);
          setRecentTrades(current=>[...current,{price:Number(t.p),amount:Number(t.q),time:Number(t.T),side:t.m?"sell":"buy"}].slice(-24));
        }catch{}
      };
    }catch{}
    return()=>{cancelled=true;ws?.close();};
  },[symbol]);

  const fmt=(value:number)=>value>=1?value.toFixed(2):value.toFixed(8).replace(/0+$/,'').replace(/\.$/,'');

  return <>
    <section className="spot-enhancements">
      <div className="spot-stats">
        <div><span>24h Change</span><strong className={change<0?"spot-negative":"spot-positive"}>{change>=0?"+":""}{change.toFixed(2)}%</strong></div>
        <div><span>24h High</span><strong>{price?(price*1.025).toFixed(2):"—"}</strong></div>
        <div><span>24h Low</span><strong>{price?(price*.975).toFixed(2):"—"}</strong></div>
        <div><span>24h Volume</span><strong>— USDT</strong></div>
      </div>
      <div className="spot-tools">
        <div className="spot-tool-tabs"><button className={tab==="book"?"active":""} onClick={()=>setTab("book")}>Order Book</button><button className={tab==="trades"?"active":""} onClick={()=>setTab("trades")}>Recent Trades</button></div>
        <button className={`spot-favorite ${favorite?"active":""}`} onClick={()=>setFavorite(v=>!v)}>{favorite?"★":"☆"} Favorite</button>
        <div className="spot-filter-row"><span>Markets</span>{["All","Favorites","Gainers","Losers"].map(item=><button key={item} className={filter===item?"active":""} onClick={()=>setFilter(item as typeof filter)}>{item}</button>)}</div>
      </div>
      {tab==="book"?<div className="spot-orderbook"><div className="spot-book-head"><span>Price (USDT)</span><span>Amount ({base})</span></div><div className="spot-book-side">{rows.map((row,i)=><div key={`sell-${i}`}><span className="spot-negative">{row.price?fmt(row.price):"—"}</span><span>{row.amount.toFixed(4)}</span></div>)}</div><div className="spot-mid-price">{price?fmt(price):"—"} <small>Last price</small></div><div className="spot-book-side">{buyRows.map((row,i)=><div key={`buy-${i}`}><span className="spot-positive">{row.price?fmt(row.price):"—"}</span><span>{row.amount.toFixed(4)}</span></div>)}</div></div>:<div className="spot-recent-trades"><div className="spot-book-head"><span>Price (USDT)</span><span>Amount ({base})</span><span>Time</span></div>{recentTrades.length?recentTrades.map((trade,i)=><div key={`${trade.time}-${i}`}><span className={trade.side==="sell"?"spot-negative":"spot-positive"}>{fmt(trade.price)}</span><span>{fmt(trade.amount)}</span><span>{new Date(trade.time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span></div>):<div className="spot-empty">Loading {pair} trades…</div>}</div>}
    </section>
    <section className="spot-orders-panel"><div className="spot-orders-tabs"><button className={ordersTab==="open"?"active":""} onClick={()=>setOrdersTab("open")}>Open Orders</button><button className={ordersTab==="history"?"active":""} onClick={()=>setOrdersTab("history")}>Order History</button><button>Trade History</button><button>Funds</button></div>{ordersTab==="open"?<div className="spot-empty"><strong>No open orders</strong><span>Your active spot orders will appear here.</span></div>:<div className="spot-empty"><strong>No order history</strong><span>Your completed and cancelled orders will appear here.</span></div>}</section>
    <div className="spot-allocation"><span>Quick amount</span>{[25,50,75,100].map(value=><button key={value} className={allocation===value?"active":""} onClick={()=>setAllocation(value)}>{value}%</button>)}<small>{allocation?`${((available*allocation)/100).toFixed(2)} USDT selected`:"Select a balance percentage"}</small></div>
  </>;
}
