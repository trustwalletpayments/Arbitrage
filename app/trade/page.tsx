"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import MarketChart from "../components/MarketChart";
import CoinIcon from "../components/CoinIcon";
import {binanceSymbol,displayPair,formatPrice} from "../../lib/market-data";
import {createSupabaseBrowserClient} from "../../lib/supabase-browser";

type MarketItem={symbol:string;baseAsset:string;quoteAsset:string;marketCapRank:number;coinId?:string;logo?:string};

function validPair(value:string|null){
  if(!value)return "BTC/USDT";
  const compact=value.toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(!compact.endsWith("USDT"))return "BTC/USDT";
  const base=compact.slice(0,-4);
  return /^[A-Z0-9]{2,20}$/.test(base)?`${base}/USDT`:"BTC/USDT";
}

export default function SpotPage(){
  const [pair,setPair]=useState("BTC/USDT");
  const [markets,setMarkets]=useState<MarketItem[]>([]);
  const [search,setSearch]=useState("");
  const [side,setSide]=useState<"Buy"|"Sell">("Buy");
  const [type,setType]=useState<"Limit"|"Market">("Limit");
  const [price,setPrice]=useState("");
  const [livePrice,setLivePrice]=useState(0);
  const [change,setChange]=useState(0);
  const [amount,setAmount]=useState("");
  const [available,setAvailable]=useState(0);
  const [message,setMessage]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const symbol=binanceSymbol(pair);
  const base=pair.split("/")[0];
  const isBuy=side==="Buy";
  const accent=isBuy?"#22c55e":"#ef4444";

  useEffect(()=>{setPair(validPair(new URLSearchParams(window.location.search).get("pair")))},[]);

  useEffect(()=>{
    let alive=true;
    async function loadMarkets(){
      try{
        const response=await fetch("https://api.binance.com/api/v3/exchangeInfo",{cache:"no-store"});
        const info=await response.json();
        const pairs=(info?.symbols||[]).filter((item:any)=>item.quoteAsset==="USDT"&&item.status==="TRADING"&&item.isSpotTradingAllowed!==false);
        const map=new Map<string,any>();
        pairs.forEach((item:any)=>map.set(String(item.baseAsset).toUpperCase(),item));
        let ranked:any[]=[];
        try{
          const ranking=await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false",{cache:"no-store"});
          if(ranking.ok)ranked=await ranking.json();
        }catch{}
        const used=new Set<string>();
        const rankedMarkets=(Array.isArray(ranked)?ranked:[]).map((coin:any,index:number)=>{
          const baseAsset=String(coin.symbol||"").toUpperCase();
          const item=map.get(baseAsset);
          if(!item)return null;
          used.add(baseAsset);
          return {symbol:item.symbol,baseAsset,quoteAsset:"USDT",marketCapRank:Number(coin.market_cap_rank||index+1),coinId:coin.id,logo:coin.image};
        }).filter(Boolean) as MarketItem[];
        const remaining=pairs.filter((item:any)=>!used.has(String(item.baseAsset).toUpperCase())).map((item:any,index:number)=>({symbol:item.symbol,baseAsset:String(item.baseAsset).toUpperCase(),quoteAsset:"USDT",marketCapRank:rankedMarkets.length+index+1}));
        if(alive)setMarkets([...rankedMarkets,...remaining].slice(0,500));
      }catch{if(alive)setMarkets([])}
    }
    loadMarkets();
    return()=>{alive=false};
  },[]);

  useEffect(()=>{
    let alive=true;
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`,{cache:"no-store"}).then(r=>r.json()).then(data=>{
      if(!alive||!data.lastPrice)return;
      const p=Number(data.lastPrice);setLivePrice(p);setPrice(String(p));setChange(Number(data.priceChangePercent||0));
    }).catch(()=>{});
    let socket:WebSocket|undefined;
    try{
      socket=new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);
      socket.onmessage=e=>{try{const data=JSON.parse(e.data);if(alive&&data.c){setLivePrice(Number(data.c));setChange(Number(data.P||0));}}catch{}};
    }catch{}
    return()=>{alive=false;socket?.close()};
  },[symbol]);

  useEffect(()=>{
    const supabase=createSupabaseBrowserClient();
    supabase.auth.getUser().then(async({data:{user}})=>{
      if(!user){setAvailable(0);return}
      const {data}=await supabase.from("account_balances").select("available").eq("user_id",user.id).eq("asset","USDT").eq("wallet","FUNDING").maybeSingle();
      setAvailable(Number(data?.available||0));
    }).catch(()=>setAvailable(0));
  },[]);

  const filteredMarkets=useMemo(()=>{
    const query=search.trim().toUpperCase();
    return query?markets.filter(item=>item.baseAsset.includes(query)||item.symbol.includes(query)):markets;
  },[markets,search]);
  const total=useMemo(()=>{const p=type==="Market"?livePrice:Number(price);const q=Number(amount);return p>0&&q>0?(p*q).toFixed(2):"0.00"},[type,livePrice,price,amount]);

  async function submit(){
    setMessage("");
    const qty=Number(amount);
    const orderPrice=type==="Market"?livePrice:Number(price);
    if(!Number.isFinite(qty)||qty<=0){setMessage("Enter a valid amount.");return}
    if(type==="Limit"&&(!Number.isFinite(orderPrice)||orderPrice<=0)){setMessage("Enter a valid limit price.");return}
    setSubmitting(true);
    try{
      const response=await fetch("/api/binance/spot-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({symbol,side,type,quantity:qty,price:orderPrice})});
      const data=await response.json();
      if(!response.ok||!data.ok)throw new Error(data.error||"Order was rejected.");
      setMessage(`Order submitted successfully. Binance order ID: ${data.order?.orderId||"—"}`);
      setAmount("");
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to submit order.");}
    finally{setSubmitting(false)}
  }

  return <main className="app-shell">
    <header className="appbar">
      <Link className="brand" href="/"><img src="/orbitex-logo.svg" alt="ORBITEX" style={{width:30,height:30,objectFit:"contain"}}/><span>ORBITEX.</span></Link>
      <nav><Link href="/dashboard">Dashboard</Link><Link className="active" href="/trade">Spot</Link><Link href="/futures">Futures</Link><Link href="/wallet">Wallet</Link><Link href="/orders">Orders</Link></nav>
      <Link className="btn" href="/dashboard">Account</Link>
    </header>
    <div className="trade-layout">
      <aside className="market-list">
        <div className="label">SPOT MARKETS</div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search coins..." aria-label="Search spot markets" style={{width:"100%",margin:"12px 0",padding:"11px 12px",borderRadius:10,border:"1px solid #263244",background:"#080d14",color:"#fff",outline:"none",boxSizing:"border-box"}}/>
        <div className="market-count" style={{color:"#687589",fontSize:11,marginBottom:8}}>{filteredMarkets.length} spot pairs</div>
        <div className="market-scroll">{filteredMarkets.map(item=>{const selected=displayPair(item.symbol)===pair;return <button key={`${item.symbol}-${item.marketCapRank}`} className={selected?"selected":""} onClick={()=>{const next=displayPair(item.symbol);setPair(next);window.history.replaceState(null,"",`/trade?pair=${encodeURIComponent(item.symbol)}`)}}><span style={{display:"inline-flex",alignItems:"center",gap:8,minWidth:0,overflow:"hidden"}}>{item.logo?<img src={item.logo} alt="" width={24} height={24} style={{borderRadius:"50%"}}/>:<CoinIcon symbol={item.baseAsset} size={24}/>}<span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.baseAsset}/USDT</span></span><small>#{item.marketCapRank}</small></button>})}</div>
      </aside>
      <section className="chart-area">
        <div className="trade-head"><div><div className="pair">{pair}</div><div className="price">{livePrice?formatPrice(livePrice):"—"} <span className={change<0?"danger":"up"}>{change>=0?"+":""}{change.toFixed(2)}%</span></div><div className="muted tiny">Live Binance spot market data</div></div><Link className="btn" href="/futures">Open Futures</Link></div>
        <MarketChart pair={pair}/>
      </section>
      <section className="order-panel" style={{padding:22,background:"linear-gradient(180deg,#0b1420 0%,#080d14 100%)",border:"1px solid #1d3046",borderRadius:18,boxShadow:"0 18px 50px rgba(0,0,0,.22)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div><div className="label">SPOT TRADING</div><h2 style={{margin:"6px 0 0",fontSize:22}}>{pair}</h2></div><span style={{fontSize:12,color:"#7f90a7"}}>Production market</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,padding:5,background:"#070c13",border:"1px solid #1d3046",borderRadius:14,marginBottom:18}}><button type="button" onClick={()=>setSide("Buy")} style={{border:0,borderRadius:10,padding:"13px 10px",fontSize:16,fontWeight:700,cursor:"pointer",color:isBuy?"#06130b":"#8b9ab0",background:isBuy?"linear-gradient(135deg,#16a34a,#22c55e)":"transparent"}}>Buy</button><button type="button" onClick={()=>setSide("Sell")} style={{border:0,borderRadius:10,padding:"13px 10px",fontSize:16,fontWeight:700,cursor:"pointer",color:!isBuy?"#fff":"#8b9ab0",background:!isBuy?"linear-gradient(135deg,#dc2626,#ef4444)":"transparent"}}>Sell</button></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:"1px solid #1d2a3b",marginBottom:22}}>{["Limit","Market"].map(item=><button type="button" key={item} onClick={()=>setType(item as "Limit"|"Market")} style={{border:0,borderBottom:type===item?`2px solid ${accent}`:"2px solid transparent",background:"transparent",color:type===item?"#eef4ff":"#7e8da3",padding:"10px 8px 13px",fontSize:14,fontWeight:600,cursor:"pointer"}}>{item}</button>)}</div>
        {type==="Limit"&&<label style={{display:"block",color:"#a9b7ca",fontSize:13,fontWeight:600,marginBottom:17}}>Price <span style={{float:"right",color:"#718198",fontWeight:400}}>USDT</span><input value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00" inputMode="decimal" style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:8,padding:"14px 15px",borderRadius:12,border:"1px solid #263b54",background:"#070c13",color:"#f1f5fb",fontSize:16,outline:"none"}}/></label>}
        <label style={{display:"block",color:"#a9b7ca",fontSize:13,fontWeight:600,marginBottom:17}}>Amount <span style={{float:"right",color:"#718198",fontWeight:400}}>{base}</span><input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:8,padding:"14px 15px",borderRadius:12,border:"1px solid #263b54",background:"#070c13",color:"#f1f5fb",fontSize:16,outline:"none"}}/></label>
        <label style={{display:"block",color:"#a9b7ca",fontSize:13,fontWeight:600,marginBottom:18}}>Total <span style={{float:"right",color:"#718198",fontWeight:400}}>USDT</span><input value={total} readOnly style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:8,padding:"14px 15px",borderRadius:12,border:"1px solid #263b54",background:"#070c13",color:"#f1f5fb",fontSize:16,outline:"none"}}/></label>
        <div style={{display:"flex",justifyContent:"space-between",padding:"14px 0",borderTop:"1px solid #1b2a3c",borderBottom:"1px solid #1b2a3c",marginBottom:18}}><span style={{color:"#8e9db2",fontSize:13}}>Available funding balance</span><strong style={{color:"#dbe6f5",fontSize:14}}>{available.toFixed(2)} USDT</strong></div>
        {message&&<div className="notice" style={{marginBottom:14}}>{message}</div>}
        <button className="btn primary full" disabled={submitting} onClick={submit} style={{width:"100%",border:0,borderRadius:12,padding:"15px 12px",fontSize:16,fontWeight:700,color:isBuy?"#06130b":"#fff",background:`linear-gradient(135deg,${isBuy?"#16a34a":"#dc2626"},${accent})`,opacity:submitting?.7:1}}>{submitting?"Submitting…":`${side} ${base}`}</button>
        <p className="muted tiny" style={{lineHeight:1.6,marginTop:16}}>Live Binance spot market data. Orders are sent only through the secured production API connection; no testnet wallet or simulated order engine is used here.</p>
      </section>
    </div>
  </main>;
}
