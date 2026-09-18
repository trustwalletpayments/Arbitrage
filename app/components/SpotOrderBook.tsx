"use client";

import {useEffect,useMemo,useState} from "react";
import {binanceSymbol,formatPrice} from "../../lib/market-data";

type Level={price:number;size:number};

function normalize(levels:any[]):Level[]{
  return (Array.isArray(levels)?levels:[]).map((row:any)=>({price:Number(row?.[0]),size:Number(row?.[1])})).filter(row=>Number.isFinite(row.price)&&Number.isFinite(row.size)&&row.price>0&&row.size>0);
}

export default function SpotOrderBook({pair}:{pair:string}){
  const symbol=binanceSymbol(pair);
  const [asks,setAsks]=useState<Level[]>([]);
  const [bids,setBids]=useState<Level[]>([]);
  const [last,setLast]=useState(0);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let alive=true;
    let socket:WebSocket|undefined;
    setLoading(true);
    setAsks([]);setBids([]);setLast(0);

    fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=20`,{cache:"no-store"})
      .then(r=>r.ok?r.json():null)
      .then(data=>{
        if(!alive||!data)return;
        setAsks(normalize(data.asks).sort((a,b)=>a.price-b.price));
        setBids(normalize(data.bids).sort((a,b)=>b.price-a.price));
        setLast(Number(data?.lastUpdateId||0));
        setLoading(false);
      }).catch(()=>{if(alive)setLoading(false)});

    try{
      socket=new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@100ms`);
      socket.onmessage=event=>{
        try{
          const data=JSON.parse(event.data);
          if(!alive)return;
          const update=(current:Level[],changes:any[],descending:boolean)=>{
            const map=new Map(current.map(level=>[level.price,level.size]));
            for(const row of changes||[]){
              const price=Number(row?.[0]);
              const size=Number(row?.[1]);
              if(!Number.isFinite(price)||!Number.isFinite(size)||price<=0)continue;
              if(size<=0)map.delete(price);else map.set(price,size);
            }
            return [...map.entries()].map(([price,size])=>({price,size})).sort((a,b)=>descending?b.price-a.price:a.price-b.price).slice(0,20);
          };
          setAsks(current=>update(current,data?.a,false));
          setBids(current=>update(current,data?.b,true));
        }catch{}
      };
    }catch{}

    return()=>{alive=false;socket?.close()};
  },[symbol]);

  const bestAsk=asks[0]?.price||0;
  const bestBid=bids[0]?.price||0;
  const mid=bestAsk&&bestBid?(bestAsk+bestBid)/2:bestAsk||bestBid;
  const spread=bestAsk&&bestBid?bestAsk-bestBid:0;
  const displayLast=mid||Number(last)||0;
  const maxTotal=useMemo(()=>Math.max(1,...asks.map(x=>x.size),...bids.map(x=>x.size)),[asks,bids]);
  const row=(level:Level,side:"ask"|"bid")=>{
    const width=Math.min(100,(level.size/maxTotal)*100);
    return <div className={`book-row ${side}`} key={`${side}-${level.price}`}>
      <span>{formatPrice(level.price)}</span><span>{level.size.toLocaleString(undefined,{maximumFractionDigits:4})}</span><span>{(level.price*level.size).toLocaleString(undefined,{maximumFractionDigits:2})}</span><i style={{width:`${width}%`}} aria-hidden="true"/>
    </div>;
  };

  return <section className="spot-order-book" aria-label={`${pair} order book`}>
    <div className="book-title"><div><span className="book-kicker">ORDER BOOK</span><strong>{pair}</strong></div><span className="book-live">LIVE</span></div>
    <div className="book-head"><span>Price (USDT)</span><span>Size ({pair.split("/")[0]})</span><span>Total (USDT)</span></div>
    <div className="book-levels">
      <div className="book-side asks">{asks.slice(0,10).reverse().map(level=>row(level,"ask"))}</div>
      <div className="book-mid"><strong>{displayLast?formatPrice(displayLast):"—"} <span>↑</span></strong>{spread>0&&<small>Spread {formatPrice(spread)}</small>}</div>
      <div className="book-side bids">{bids.slice(0,10).map(level=>row(level,"bid"))}</div>
      {loading&&<div className="book-loading">Loading market depth…</div>}
    </div>
  </section>;
}
