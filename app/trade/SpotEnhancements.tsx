"use client";

import {useMemo, useState} from "react";

type Props={pair:string;livePrice:number;change:number;available:number};

export default function SpotEnhancements({pair,livePrice,change,available}:Props){
  const [tab,setTab]=useState<"book"|"trades">("book");
  const [ordersTab,setOrdersTab]=useState<"open"|"history">("open");
  const [filter,setFilter]=useState<"All"|"Favorites"|"Gainers"|"Losers">("All");
  const [allocation,setAllocation]=useState(0);
  const [favorite,setFavorite]=useState(false);
  const base=pair.split("/")[0];
  const price=livePrice||0;
  const rows=useMemo(()=>[0.998,0.997,0.996,0.995].map((factor,index)=>({price:price?price*factor:0,amount:[0.042,0.018,0.031,0.025][index]})),[price]);
  const buyRows=useMemo(()=>[1.000,0.999,0.998,0.997].map((factor,index)=>({price:price?price*factor:0,amount:[0.025,0.047,0.019,0.034][index]})),[price]);
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
      {tab==="book"?<div className="spot-orderbook"><div className="spot-book-head"><span>Price (USDT)</span><span>Amount ({base})</span></div><div className="spot-book-side">{rows.map((row,i)=><div key={`sell-${i}`}><span className="spot-negative">{row.price?row.price.toFixed(2):"—"}</span><span>{row.amount.toFixed(4)}</span></div>)}</div><div className="spot-mid-price">{price?price.toFixed(2):"—"} <small>Last price</small></div><div className="spot-book-side">{buyRows.map((row,i)=><div key={`buy-${i}`}><span className="spot-positive">{row.price?row.price.toFixed(2):"—"}</span><span>{row.amount.toFixed(4)}</span></div>)}</div></div>:<div className="spot-recent-trades"><div className="spot-book-head"><span>Price (USDT)</span><span>Amount ({base})</span><span>Time</span></div>{[0,1,2,3,4].map(i=><div key={i}><span className={i%2?"spot-negative":"spot-positive"}>{price?(price*(1+(i-2)*.0002)).toFixed(2):"—"}</span><span>{(0.01+i*.006).toFixed(4)}</span><span>Just now</span></div>)}</div>}
    </section>
    <section className="spot-orders-panel"><div className="spot-orders-tabs"><button className={ordersTab==="open"?"active":""} onClick={()=>setOrdersTab("open")}>Open Orders</button><button className={ordersTab==="history"?"active":""} onClick={()=>setOrdersTab("history")}>Order History</button><button>Trade History</button><button>Funds</button></div>{ordersTab==="open"?<div className="spot-empty"><strong>No open orders</strong><span>Your active spot orders will appear here.</span></div>:<div className="spot-empty"><strong>No order history</strong><span>Your completed and cancelled orders will appear here.</span></div>}</section>
    <div className="spot-allocation"><span>Quick amount</span>{[25,50,75,100].map(value=><button key={value} className={allocation===value?"active":""} onClick={()=>setAllocation(value)}>{value}%</button>)}<small>{allocation?`${((available*allocation)/100).toFixed(2)} USDT selected`:"Select a balance percentage"}</small></div>
  </>;
}
