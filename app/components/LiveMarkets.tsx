"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {MARKET_SYMBOLS,displayPair,formatPrice,formatVolume} from "../../lib/market-data";
import CoinIcon from "./CoinIcon";

type Row={price:number;change:number;volume:number};

export default function LiveMarkets(){
 const [data,setData]=useState<Record<string,Row>>({});
 const [connected,setConnected]=useState(false);
 const [search,setSearch]=useState("");

 useEffect(()=>{
  let alive=true;
  const symbols=MARKET_SYMBOLS.map(s=>s.toLowerCase());
  fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(MARKET_SYMBOLS))}`)
   .then(r=>r.json())
   .then(rows=>{
    if(!alive||!Array.isArray(rows))return;
    const next:Record<string,Row>={};
    rows.forEach((r:{symbol:string,lastPrice:string,priceChangePercent:string,quoteVolume:string})=>{
     next[r.symbol]={price:Number(r.lastPrice),change:Number(r.priceChangePercent),volume:Number(r.quoteVolume)};
    });
    setData(next);
   })
   .catch(()=>{});

  const ws=new WebSocket(`wss://stream.binance.com:9443/stream?streams=${symbols.map(s=>`${s}@ticker`).join("/")}`);
  ws.onopen=()=>alive&&setConnected(true);
  ws.onclose=()=>alive&&setConnected(false);
  ws.onmessage=e=>{
   try{
    const r=JSON.parse(e.data).data as {s:string,c:string,P:string,q:string};
    setData(prev=>({...prev,[r.s]:{price:Number(r.c),change:Number(r.P),volume:Number(r.q)}}));
   }catch{}
  };
  return()=>{alive=false;ws.close()};
 },[]);

 const filteredSymbols=useMemo(()=>{
  const query=search.trim().toLowerCase();
  if(!query)return MARKET_SYMBOLS;
  return MARKET_SYMBOLS.filter(symbol=>{
   const pair=displayPair(symbol).toLowerCase();
   const coin=symbol.replace("USDT","").toLowerCase();
   return pair.includes(query)||coin.includes(query)||symbol.toLowerCase().includes(query);
  });
 },[search]);

 return <div className="panel">
  <div className="live-status"><span className={connected?"status-dot":"status-dot offline"}></span>{connected?"Live market feed":"Connecting to market feed…"}</div>
  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
   <input
    aria-label="Search coins"
    value={search}
    onChange={e=>setSearch(e.target.value)}
    placeholder="Search coins..."
    style={{width:"min(320px,100%)",padding:"12px 14px",borderRadius:10,border:"1px solid #243b55",background:"#0b1624",color:"#fff",outline:"none"}}
   />
  </div>
  <table className="table"><thead><tr><th>Pair</th><th>Last price</th><th>24h change</th><th>24h volume</th><th></th></tr></thead><tbody>
   {filteredSymbols.map(symbol=>{
    const r=data[symbol],base=symbol.replace("USDT","");
    return <tr key={symbol}><td><span style={{display:"inline-flex",alignItems:"center",gap:10}}><CoinIcon symbol={base} size={30}/><strong>{displayPair(symbol)}</strong></span></td><td>{r?formatPrice(r.price):"—"}</td><td className={r&&r.change<0?"danger":"up"}>{r?`${r.change>=0?"+":""}${r.change.toFixed(2)}%`:"—"}</td><td>{r?formatVolume(r.volume):"—"}</td><td><Link className="btn" href={`/trade?pair=${encodeURIComponent(symbol)}`}>Trade</Link></td></tr>;
   })}
   {filteredSymbols.length===0&&<tr><td colSpan={5} style={{textAlign:"center",padding:"28px"}}>No coins found</td></tr>}
  </tbody></table>
 </div>;
}
