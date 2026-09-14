"use client";

import {useEffect,useMemo,useState} from "react";

type Level=[number,number];

type Props={symbol:string};

export default function FuturesOrderBook({symbol}:Props){
  const [bids,setBids]=useState<Level[]>([]);
  const [asks,setAsks]=useState<Level[]>([]);
  const [last,setLast]=useState(0);

  useEffect(()=>{
    const stream=symbol.toLowerCase()+"@depth20@100ms";
    const trades=symbol.toLowerCase()+"@aggTrade";
    const depth=new WebSocket(`wss://fstream.binance.com/ws/${stream}`);
    const tape=new WebSocket(`wss://fstream.binance.com/ws/${trades}`);
    depth.onmessage=e=>{try{const d=JSON.parse(e.data);setBids((d.b||[]).map((x:string[])=>[Number(x[0]),Number(x[1])] as Level));setAsks((d.a||[]).map((x:string[])=>[Number(x[0]),Number(x[1])] as Level));}catch{}};
    tape.onmessage=e=>{try{const d=JSON.parse(e.data);const p=Number(d.p);if(Number.isFinite(p))setLast(p);}catch{}};
    return()=>{depth.close();tape.close()};
  },[symbol]);

  const maxTotal=useMemo(()=>Math.max(1,...bids.map(([,q])=>q),...asks.map(([,q])=>q)),[bids,asks]);
  const spread=asks[0]&&bids[0]?asks[0][0]-bids[0][0]:0;
  const rows=(levels:Level[],type:"bid"|"ask")=>levels.slice(0,12).map(([price,qty])=><div className={`ob-row ${type}`} key={`${type}-${price}`}><span>{price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:8})}</span><span>{qty.toLocaleString(undefined,{maximumFractionDigits:4})}</span><i style={{width:`${Math.min(100,qty/maxTotal*100)}%`}}/></div>);

  return <section className="futures-orderbook panel"><div className="section-heading"><div><div className="label">MARKET DEPTH</div><h2>Order book</h2></div><span className="muted tiny">Live public feed</span></div><div className="ob-head"><span>Price (USDT)</span><span>Quantity</span></div><div className="ob-asks">{rows(asks.slice().reverse(),"ask")}</div><div className="ob-mid"><strong>{last?last.toLocaleString(undefined,{maximumFractionDigits:8}):"—"}</strong><span>Spread {spread?spread.toFixed(2):"—"}</span></div><div className="ob-bids">{rows(bids,"bid")}</div></section>;
}
