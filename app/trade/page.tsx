"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import MarketChart from "../components/MarketChart";
import CoinIcon from "../components/CoinIcon";
import {binanceSymbol,displayPair,formatPrice} from "../../lib/market-data";
import {createSupabaseBrowserClient} from "../../lib/supabase-browser";

const referencePrice=113842.20;
type MarketItem={symbol:string;baseAsset:string;quoteAsset:string;marketCapRank:number};
function validPair(value:string|null):string{if(!value)return "BTC/USDT";const compact=value.toUpperCase().replace(/[^A-Z0-9]/g,"");if(!compact.endsWith("USDT"))return "BTC/USDT";const base=compact.slice(0,-4);if(!/^[A-Z0-9]{2,20}$/.test(base))return "BTC/USDT";return `${base}/USDT`}

export default function Trade(){
 const [pair,setPair]=useState("BTC/USDT");const [markets,setMarkets]=useState<MarketItem[]>([]);const [search,setSearch]=useState("");const [side,setSide]=useState("Buy");const [type,setType]=useState("Limit");const [price,setPrice]=useState(String(referencePrice));const [livePrice,setLivePrice]=useState(referencePrice);const [change,setChange]=useState(0);const [amount,setAmount]=useState("");const [submitting,setSubmitting]=useState(false);const [message,setMessage]=useState("");const [available,setAvailable]=useState(0);const symbol=binanceSymbol(pair);const base=pair.split("/")[0];
 useEffect(()=>{const params=new URLSearchParams(window.location.search);setPair(validPair(params.get("pair")))},[]);
 useEffect(()=>{
  let alive=true;
  async function loadMarkets(){
   try{
    const exchangeResponse=await fetch("https://api.binance.com/api/v3/exchangeInfo",{cache:"no-store"});
    if(!exchangeResponse.ok)throw new Error("Unable to load exchange markets");
    const exchangeInfo=await exchangeResponse.json();
    const rankMap=new Map<string,number>();
    const pages=await Promise.allSettled(Array.from({length:4},(_,index)=>fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${index+1}&sparkline=false`,{cache:"no-store"}).then(response=>response.ok?response.json():[])));
    pages.forEach(result=>{if(result.status==="fulfilled"&&Array.isArray(result.value)){result.value.forEach((coin:any)=>{if(coin?.symbol&&coin?.market_cap_rank)rankMap.set(String(coin.symbol).toUpperCase(),Number(coin.market_cap_rank))})}});
    const list=(Array.isArray(exchangeInfo?.symbols)?exchangeInfo.symbols:[]).filter((item:any)=>item.quoteAsset==="USDT"&&item.status==="TRADING"&&item.isSpotTradingAllowed!==false).map((item:any)=>({symbol:item.symbol,baseAsset:item.baseAsset,quoteAsset:item.quoteAsset,marketCapRank:rankMap.get(String(item.baseAsset).toUpperCase())||999999})).sort((a:MarketItem,b:MarketItem)=>a.marketCapRank-b.marketCapRank||a.baseAsset.localeCompare(b.baseAsset));
    if(alive)setMarkets(list);
   }catch{if(alive)setMarkets([])}
  }
  loadMarkets();
  return()=>{alive=false}
 },[]);
 const filteredMarkets=useMemo(()=>{const query=search.trim().toUpperCase();if(!query)return markets;return markets.filter(item=>item.symbol.includes(query)||item.baseAsset.includes(query))},[markets,search]);
 useEffect(()=>{let alive=true;setMessage("");fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`).then(r=>r.json()).then(r=>{if(alive&&r.lastPrice){const p=Number(r.lastPrice);setLivePrice(p);setPrice(String(p));setChange(Number(r.priceChangePercent||0))}}).catch(()=>{});const ws=new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);ws.onmessage=e=>{try{const r=JSON.parse(e.data);if(alive){setLivePrice(Number(r.c));setChange(Number(r.P))}}catch{}};return()=>{alive=false;ws.close()}},[symbol]);
 useEffect(()=>{setPrice(String(livePrice));setMessage("")},[pair]);
 async function refreshBalance(){const supabase=createSupabaseBrowserClient();const {data:{user}}=await supabase.auth.getUser();if(!user){setAvailable(0);return}const {data}=await supabase.from("account_balances").select("available").eq("user_id",user.id).eq("asset","USDT").eq("wallet","SPOT").maybeSingle();setAvailable(Number(data?.available||0))}
 useEffect(()=>{refreshBalance().catch(()=>setAvailable(0))},[]);
 const size=useMemo(()=>{const p=Number(type==="Market"?livePrice:price);const q=Number(amount);return p>0&&q>0?(p*q).toFixed(2):"0.00"},[price,amount,type,livePrice]);
 async function submit(){setMessage("");const orderPrice=type==="Market"?livePrice:Number(price);const quantity=Number(amount);if(!Number.isFinite(orderPrice)||orderPrice<=0||!Number.isFinite(quantity)||quantity<=0){setMessage("Enter a valid price and amount.");return}setSubmitting(true);try{const res=await fetch("/api/testnet/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({symbol:pair,side:side.toUpperCase(),type:type.toUpperCase(),price:orderPrice,quantity,clientOrderId:crypto.randomUUID()})});const data=await res.json();if(!res.ok||!data.ok)throw new Error(data.error||"Order rejected");await refreshBalance();setMessage(`Testnet order filled: ${data.order?.side||side.toUpperCase()} ${data.order?.quantity||quantity} ${base} @ ${formatPrice(orderPrice)}`);setAmount("")}catch(error){setMessage(error instanceof Error?error.message:"Order failed")}finally{setSubmitting(false)}}
 return <main className="app-shell"><header className="appbar"><Link className="brand" href="/"><img src="/orbitex-logo.svg" alt="ORBITEX" style={{width:30,height:30,objectFit:"contain"}}/><span>ORBITEX.</span></Link><nav><Link href="/dashboard">Dashboard</Link><Link className="active" href="/trade">Spot</Link><Link href="/futures">Futures</Link><Link href="/wallet">Wallet</Link><Link href="/orders">Orders</Link></nav><Link className="btn" href="/dashboard">Account</Link></header><div className="trade-layout"><aside className="market-list"><div className="label">MARKETS</div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search coins..." aria-label="Search coins" style={{width:"100%",margin:"12px 0",padding:"10px 11px",borderRadius:8,border:"1px solid #263244",background:"#080d14",color:"#fff",outline:"none"}}/><div className="market-count" style={{color:"#687589",fontSize:11,marginBottom:8}}>{filteredMarkets.length} coins · Market cap</div>{filteredMarkets.map(m=>{const p=displayPair(m.symbol),coin=m.baseAsset;return <button className={p===pair?"selected":""} onClick={()=>setPair(p)} key={m.symbol}><span style={{display:"inline-flex",alignItems:"center",gap:7}}><CoinIcon symbol={coin} size={24}/>{p}</span><small>{m.marketCapRank<999999?`#${m.marketCapRank}`:"LIVE"}</small></button>})}</aside><section className="chart-area"><div className="trade-head"><div><div className="pair">{pair}</div><div className="price">{formatPrice(livePrice)} <span className={change<0?"danger":"up"}>{change>=0?"+":""}{change.toFixed(2)}%</span></div><div className="muted tiny">Live public market price</div></div><Link className="btn" href="/futures">Open Futures</Link></div><MarketChart pair={pair}/></section><section className="order-panel"><div className="tabs"><button className={side==="Buy"?"on":""} onClick={()=>setSide("Buy")}>Buy</button><button className={side==="Sell"?"on":""} onClick={()=>setSide("Sell")}>Sell</button></div><div className="order-types">{["Limit","Market"].map(t=><button className={type===t?"on":""} onClick={()=>setType(t)} key={t}>{t}</button>)}</div><label>Price<input value={type==="Market"?formatPrice(livePrice):price} disabled={type==="Market"} onChange={e=>setPrice(e.target.value)} placeholder="USDT"/></label><label>Amount<input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" placeholder="0.00"/></label><label>Size<input value={`${size} USDT`} readOnly/></label><div className="order-info"><span>Available</span><span>{available.toFixed(2)} USDT</span></div>{message&&<div className="notice">{message}</div>}<button className="btn primary full" disabled={submitting} onClick={submit}>{submitting?"Submitting…":`${side} ${base}`}</button><p className="muted tiny">Testnet only. Orders are authenticated and settled through the server-side exchange ledger; no real funds are submitted.</p><Link className="muted tiny" href="/orders">View testnet order history →</Link></section></div></main>
}
