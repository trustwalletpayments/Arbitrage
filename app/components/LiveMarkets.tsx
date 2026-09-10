"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {MARKET_SYMBOLS,displayPair,formatPrice,formatVolume} from "../../lib/market-data";

type Row={price:number;change:number;volume:number};
export default function LiveMarkets(){
  const [data,setData]=useState<Record<string,Row>>({});
  const [connected,setConnected]=useState(false);
  useEffect(()=>{
    let alive=true;
    const symbols=MARKET_SYMBOLS.map(s=>s.toLowerCase());
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(MARKET_SYMBOLS))}`)
      .then(r=>r.json()).then(rows=>{if(!alive||!Array.isArray(rows))return;const next:Record<string,Row>={};rows.forEach((r:{symbol:string,lastPrice:string,priceChangePercent:string,quoteVolume:string})=>{next[r.symbol]={price:Number(r.lastPrice),change:Number(r.priceChangePercent),volume:Number(r.quoteVolume)}});setData(next)}).catch(()=>{});
    const ws=new WebSocket(`wss://stream.binance.com:9443/stream?streams=${symbols.map(s=>`${s}@ticker`).join("/")}`);
    ws.onopen=()=>alive&&setConnected(true);
    ws.onclose=()=>alive&&setConnected(false);
    ws.onmessage=e=>{try{const r=JSON.parse(e.data).data as {s:string,c:string,P:string,q:string};setData(prev=>({...prev,[r.s]:{price:Number(r.c),change:Number(r.P),volume:Number(r.q)}}))}catch{}};
    return()=>{alive=false;ws.close()}
  },[]);
  return <div className="panel"><div className="live-status"><span className={connected?"status-dot":"status-dot offline"}></span>{connected?"Live market feed":"Connecting to market feed…"}</div><table className="table"><thead><tr><th>Pair</th><th>Last price</th><th>24h change</th><th>24h volume</th><th></th></tr></thead><tbody>{MARKET_SYMBOLS.map(symbol=>{const r=data[symbol];return <tr key={symbol}><td><strong>{displayPair(symbol)}</strong></td><td>{r?formatPrice(r.price):"—"}</td><td className={r&&r.change<0?"danger":"up"}>{r?`${r.change>=0?"+":""}${r.change.toFixed(2)}%`:"—"}</td><td>{r?formatVolume(r.volume):"—"}</td><td><Link className="btn" href={`/trade?pair=${encodeURIComponent(displayPair(symbol))}`}>Trade</Link></td></tr>})}</tbody></table></div>
}
