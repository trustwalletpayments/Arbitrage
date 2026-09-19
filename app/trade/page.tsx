"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import OrbitexMarketChart from "../components/OrbitexMarketChart";
import SpotOrderBook from "../components/SpotOrderBook";
import CoinIcon from "../components/CoinIcon";
import {binanceSymbol,displayPair,formatPrice} from "../../lib/market-data";
import {createSupabaseBrowserClient} from "../../lib/supabase-browser";
import "./spot-mobile.css";
import "./spot-pro.css";
import "./spot-orderbook-width.css";
import "./spot-layout-fixes.css";
import "./spot-header-flat.css";
import "./spot-header-final-fix.css";
import "./orbitex-chart-terminal.css";

type MarketItem={symbol:string;baseAsset:string;quoteAsset:string;marketCapRank:number;coinId?:string;logo?:string};
type MarketTicker={last:number;change:number};
function validPair(value:string|null){if(!value)return "BTC/USDT";const compact=value.toUpperCase().replace(/[^A-Z0-9]/g,"");if(!compact.endsWith("USDT"))return "BTC/USDT";const base=compact.slice(0,-4);return /^[A-Z0-9]{2,20}$/.test(base)?`${base}/USDT`:"BTC/USDT"}

export default function SpotPage(){
  const [pair,setPair]=useState("BTC/USDT");const [markets,setMarkets]=useState<MarketItem[]>([]);const [marketTickers,setMarketTickers]=useState<Record<string,MarketTicker>>({});const [search,setSearch]=useState("");const [expanded,setExpanded]=useState(false);const [tradingMode,setTradingMode]=useState<"Spot"|"Cross"|"Isolated"|"Grid">("Spot");const [type,setType]=useState<"Limit"|"Market"|"Stop Limit">("Limit");const [price,setPrice]=useState("");const [stopPrice,setStopPrice]=useState("");const [livePrice,setLivePrice]=useState(0);const [change,setChange]=useState(0);const [high,setHigh]=useState(0);const [low,setLow]=useState(0);const [volume,setVolume]=useState(0);const [buyAmount,setBuyAmount]=useState("");const [sellAmount,setSellAmount]=useState("");const [buyPercent,setBuyPercent]=useState(0);const [sellPercent,setSellPercent]=useState(0);const [available,setAvailable]=useState(0);const [availableBase,setAvailableBase]=useState(0);const [message,setMessage]=useState("");const [submitting,setSubmitting]=useState<"Buy"|"Sell"|null>(null);const symbol=binanceSymbol(pair);const base=pair.split("/")[0];

  useEffect(()=>{setPair(validPair(new URLSearchParams(window.location.search).get("pair")))},[]);
  useEffect(()=>{let alive=true;async function load(){try{const response=await fetch("https://api.binance.com/api/v3/exchangeInfo",{cache:"no-store"});const info=await response.json();const pairs=(info?.symbols||[]).filter((item:any)=>item.quoteAsset==="USDT"&&item.status==="TRADING"&&item.isSpotTradingAllowed!==false);const map=new Map<string,any>();pairs.forEach((item:any)=>map.set(String(item.baseAsset).toUpperCase(),item));let ranked:any[]=[];try{const ranking=await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false",{cache:"no-store"});if(ranking.ok)ranked=await ranking.json()}catch{}const used=new Set<string>();const rankedMarkets=(Array.isArray(ranked)?ranked:[]).map((coin:any,index:number)=>{const baseAsset=String(coin.symbol||"").toUpperCase();const item=map.get(baseAsset);if(!item)return null;used.add(baseAsset);return {symbol:item.symbol,baseAsset,quoteAsset:"USDT",marketCapRank:Number(coin.market_cap_rank||index+1),coinId:coin.id,logo:coin.image}}).filter(Boolean) as MarketItem[];const remaining=pairs.filter((item:any)=>!used.has(String(item.baseAsset).toUpperCase())).map((item:any,index:number)=>({symbol:item.symbol,baseAsset:String(item.baseAsset).toUpperCase(),quoteAsset:"USDT",marketCapRank:rankedMarkets.length+index+1}));if(alive)setMarkets([...rankedMarkets,...remaining].slice(0,500))}catch{if(alive)setMarkets([])}}load();return()=>{alive=false}},[]);

  useEffect(()=>{let alive=true;async function loadTickers(){try{const response=await fetch("https://api.binance.com/api/v3/ticker/24hr",{cache:"no-store"});if(!response.ok)throw new Error();const data=await response.json();if(!alive||!Array.isArray(data))return;const next:Record<string,MarketTicker>={};data.forEach((item:any)=>{const s=String(item.symbol||"").toUpperCase();if(s.endsWith("USDT"))next[s]={last:Number(item.lastPrice||0),change:Number(item.priceChangePercent||0)}});setMarketTickers(next)}catch{}}loadTickers();const timer=window.setInterval(loadTickers,5000);return()=>{alive=false;window.clearInterval(timer)}},[]);

  useEffect(()=>{let alive=true;fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`,{cache:"no-store"}).then(r=>r.json()).then(data=>{if(!alive||!data.lastPrice)return;const p=Number(data.lastPrice);setLivePrice(p);setPrice(String(p));setChange(Number(data.priceChangePercent||0));setHigh(Number(data.highPrice||0));setLow(Number(data.lowPrice||0));setVolume(Number(data.v||0))}).catch(()=>{});let socket:WebSocket|undefined;try{socket=new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);socket.onmessage=e=>{try{const data=JSON.parse(e.data);if(alive&&data.c){setLivePrice(Number(data.c));setChange(Number(data.P||0));setHigh(Number(data.h||0));setLow(Number(data.l||0));setVolume(Number(data.v||0))}}catch{}}}catch{}return()=>{alive=false;socket?.close()}},[symbol]);
  useEffect(()=>{const supabase=createSupabaseBrowserClient();supabase.auth.getUser().then(async({data:{user}})=>{if(!user){setAvailable(0);return}const {data}=await supabase.from("account_balances").select("available").eq("user_id",user.id).eq("asset","USDT").eq("wallet","FUNDING").maybeSingle();setAvailable(Number(data?.available||0))}).catch(()=>setAvailable(0))},[]);
  const filteredMarkets=useMemo(()=>{const query=search.trim().toUpperCase();return query?markets.filter(item=>item.baseAsset.includes(query)||item.symbol.includes(query)):markets},[markets,search]);
  const orderPrice=type==="Market"?livePrice:Number(price);const buyTotal=useMemo(()=>{const qty=Number(buyAmount);return orderPrice>0&&qty>0?qty*orderPrice:0},[orderPrice,buyAmount]);const sellTotal=useMemo(()=>{const qty=Number(sellAmount);return orderPrice>0&&qty>0?qty*orderPrice:0},[orderPrice,sellAmount]);
  function selectMarket(next:string){setPair(next);setExpanded(false);window.history.replaceState(null,"",`/trade?pair=${encodeURIComponent(next.replace("/",""))}`)}
  async function submit(orderSide:"Buy"|"Sell",rawQuantity:string){
    setMessage("");
    if(tradingMode!=="Spot"){setMessage(tradingMode+" mode is shown in the Spot terminal, but live routing for this mode is not enabled yet.");return}
    const qty=Number(rawQuantity);
    if(!Number.isFinite(qty)||qty<=0){setMessage("Enter a valid "+base+" amount.");return}
    if(type==="Market"&&livePrice<=0){setMessage("Live market price is unavailable.");return}
    if(type==="Limit"&&(!Number.isFinite(orderPrice)||orderPrice<=0)){setMessage("Enter a valid limit price.");return}
    if(type==="Stop Limit"&&(!Number.isFinite(orderPrice)||orderPrice<=0||!Number.isFinite(Number(stopPrice))||Number(stopPrice)<=0)){setMessage("Enter a valid stop price and limit price.");return}
    setSubmitting(orderSide);
    try{
      const response=await fetch("/api/binance/spot-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({symbol,side:orderSide,type,quantity:qty,price:orderPrice,stopPrice:Number(stopPrice)})});
      const data=await response.json();
      if(!response.ok||!data.ok)throw new Error(data.error||"Order was rejected.");
      setMessage(orderSide+" order submitted successfully. Binance order ID: "+(data.order?.orderId||"—"));
      if(orderSide==="Buy"){setBuyAmount("");setBuyPercent(0)}else{setSellAmount("");setSellPercent(0)}
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to submit order")}
    finally{setSubmitting(null)}
  }
  const inputStyle={display:"block",width:"100%",boxSizing:"border-box" as const,marginTop:8,padding:"12px 14px",borderRadius:10,border:"1px solid #263b54",background:"#070c13",color:"#f1f5fb",fontSize:15,outline:"none"};const labelStyle={display:"block",color:"#a9b7ca",fontSize:12,fontWeight:600,marginBottom:14};

  return <main className="app-shell">
    <header className="appbar"><Link className="brand" href="/"><img src="/orbitex-logo.svg" alt="ORBITEX" style={{width:30,height:30,objectFit:"contain"}}/><span>ORBITEX.</span></Link><nav><Link href="/dashboard">Dashboard</Link><Link className="active" href="/trade">Spot</Link><Link href="/futures">Futures</Link><Link href="/wallet">Wallet</Link><Link href="/orders">Orders</Link></nav><Link className="btn" href="/dashboard">Account</Link></header>
    <div className="trade-layout spot-reference-layout">
      <SpotOrderBook pair={pair}/>
      <section className="chart-area">
        <div className="trade-head spot-market-header"><div className="spot-pair-block"><div className="pair">{pair}</div><div className="price-line"><strong>{livePrice?formatPrice(livePrice):"—"}</strong><span className={change<0?"danger":"up"}>{change>=0?"+":""}{change.toFixed(2)}%</span></div></div><div className="market-stats"><div><span>24h Change</span><strong className={change<0?"danger":"up"}>{change>=0?"+":""}{change.toFixed(2)}%</strong></div><div><span>24h High</span><strong>{high?formatPrice(high):"—"}</strong></div><div><span>24h Low</span><strong>{low?formatPrice(low):"—"}</strong></div><div><span>24h Volume ({base})</span><strong>{volume?volume.toLocaleString(undefined,{maximumFractionDigits:2}):"—"}</strong></div></div></div>
        <OrbitexMarketChart pair={pair}/>
        <section className="order-panel spot-order-entry">
          <div className="spot-entry-top"><div><div className="spot-entry-kicker">SPOT TRADING</div><h2>{pair}</h2></div><div className="spot-entry-meta"><span>Fees included at execution</span><strong>{type}</strong></div></div>
          <div className="spot-mode-tabs">{["Spot","Cross","Isolated","Grid"].map(item=><button type="button" key={item} onClick={()=>setTradingMode(item as "Spot"|"Cross"|"Isolated"|"Grid")} className={tradingMode===item?"active":""}>{item}</button>)}</div>
          <div className="spot-order-types">{["Limit","Market","Stop Limit"].map(item=><button type="button" key={item} onClick={()=>setType(item as "Limit"|"Market"|"Stop Limit")} className={type===item?"active":""}>{item}</button>)}</div>
          <div className="spot-order-columns">
            <div className="spot-side-form buy-form">
              <div className="spot-side-head"><div><span>BUY</span><strong>{base}</strong></div><small>Available <b>{available.toFixed(2)} USDT</b></small></div>
              <label className="spot-field">{type==="Stop Limit"&&<><span>USDT</span><div className="spot-input-wrap"><input value={stopPrice} onChange={e=>setStopPrice(e.target.value)} placeholder="Stop price" inputMode="decimal"/><em>USDT</em></div></>}<span>{type==="Stop Limit"?"Limit Price":"Price"} USDT</span><div className="spot-input-wrap"><input value={type==="Market"?(livePrice?formatPrice(livePrice):"Market price"):price} onChange={e=>setPrice(e.target.value)} readOnly={type==="Market"} placeholder={type==="Stop Limit"?"Limit price":"Price"} inputMode="decimal"/><em>USDT</em></div></label>
              <label className="spot-field">Amount <span>{base}</span><div className="spot-input-wrap"><input value={buyAmount} onChange={e=>setBuyAmount(e.target.value)} placeholder="Amount" inputMode="decimal"/><em>{base}</em></div></label>
              <div className="spot-percent"><input type="range" min="0" max="100" step="1" value={buyPercent} onChange={e=>{const pct=Number(e.target.value);setBuyPercent(pct);setBuyAmount(orderPrice>0?(available*pct/100/orderPrice).toFixed(8):"")}}/><div><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div></div>
              <label className="spot-field">Total <span>USDT</span><div className="spot-input-wrap"><input value={buyTotal?buyTotal.toFixed(2):""} readOnly placeholder="Total"/><em>USDT</em></div></label>
              <label className="spot-check"><input type="checkbox"/><span>TP / SL</span></label>
              <div className="spot-balance-line"><span>Available</span><strong>{available.toFixed(2)} USDT</strong></div>
              <div className="spot-balance-line"><span>Max Buy</span><strong>{orderPrice>0?(available/orderPrice).toFixed(8):"0.00000000"} {base}</strong></div>
              <div className="spot-balance-line"><span>Est. Fee</span><strong>Included</strong></div>
              <button className="spot-submit buy-submit" disabled={!!submitting} onClick={()=>submit("Buy",buyAmount)}>{submitting==="Buy"?"Submitting…":"Buy "+base}</button>
            </div>
            <div className="spot-side-form sell-form">
              <div className="spot-side-head"><div><span>SELL</span><strong>{base}</strong></div><small>Available <b>{availableBase.toFixed(8)} {base}</b></small></div>
              <label className="spot-field">{type==="Stop Limit"&&<><span>USDT</span><div className="spot-input-wrap"><input value={stopPrice} onChange={e=>setStopPrice(e.target.value)} placeholder="Stop price" inputMode="decimal"/><em>USDT</em></div></>}<span>{type==="Stop Limit"?"Limit Price":"Price"} USDT</span><div className="spot-input-wrap"><input value={type==="Market"?(livePrice?formatPrice(livePrice):"Market price"):price} onChange={e=>setPrice(e.target.value)} readOnly={type==="Market"} placeholder={type==="Stop Limit"?"Limit price":"Price"} inputMode="decimal"/><em>USDT</em></div></label>
              <label className="spot-field">Amount <span>{base}</span><div className="spot-input-wrap"><input value={sellAmount} onChange={e=>setSellAmount(e.target.value)} placeholder="Amount" inputMode="decimal"/><em>{base}</em></div></label>
              <div className="spot-percent"><input type="range" min="0" max="100" step="1" value={sellPercent} onChange={e=>{const pct=Number(e.target.value);setSellPercent(pct);setSellAmount((availableBase*pct/100).toFixed(8))}}/><div><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div></div>
              <label className="spot-field">Total <span>USDT</span><div className="spot-input-wrap"><input value={sellTotal?sellTotal.toFixed(2):""} readOnly placeholder="Total"/><em>USDT</em></div></label>
              <label className="spot-check"><input type="checkbox"/><span>TP / SL</span></label>
              <div className="spot-balance-line"><span>Available</span><strong>{availableBase.toFixed(8)} {base}</strong></div>
              <div className="spot-balance-line"><span>Max Sell</span><strong>{availableBase.toFixed(8)} {base}</strong></div>
              <div className="spot-balance-line"><span>Est. Fee</span><strong>Included</strong></div>
              <button className="spot-submit sell-submit" disabled={!!submitting} onClick={()=>submit("Sell",sellAmount)}>{submitting==="Sell"?"Submitting…":"Sell "+base}</button>
            </div>
          </div>
          {message&&<div className="spot-order-message">{message}</div>}
        </section>
      </section>
      <aside className={`market-list reference-market-list ${expanded?"expanded":""}`}>
        <div className="market-list-top"><div className="label">MARKETS</div><span>USDT</span></div>
        <input className="spot-mobile-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search" aria-label="Search spot markets"/>
        <input className="desktop-market-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search" aria-label="Search spot markets"/>
        <div className="market-columns"><span>Currency</span><span>Last</span><span>Change</span></div>
        <div className="market-scroll">{filteredMarkets.map(item=>{const selected=displayPair(item.symbol)===pair;const ticker=marketTickers[String(item.symbol).toUpperCase()];return <button key={`${item.symbol}-${item.marketCapRank}`} className={selected?"selected":""} onClick={()=>selectMarket(displayPair(item.symbol))}><span className="market-name">{item.logo?<img src={item.logo} alt="" width={28} height={28}/>:<CoinIcon symbol={item.baseAsset} size={28}/>}<b>{item.baseAsset}/USDT</b></span><span className="market-last">{ticker?.last?formatPrice(ticker.last):"—"}</span><span className={`market-change ${ticker&&ticker.change<0?"danger":""}`}>{ticker?`${ticker.change>=0?"+":""}${ticker.change.toFixed(2)}%`:"—"}</span></button>})}</div>
        <button type="button" className="spot-expand-button" onClick={()=>setExpanded(value=>!value)}>{expanded?"Collapse coins":"Expand all coins"}<span>{expanded?"⌃":"⌄"}</span></button>
      </aside>
    </div>
  </main>;
}
