"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import MarketChart from "../components/MarketChart";
import CoinIcon from "../components/CoinIcon";
import {binanceSymbol,displayPair,formatPrice} from "../../lib/market-data";
import {createSupabaseBrowserClient} from "../../lib/supabase-browser";

type MarketItem={symbol:string;baseAsset:string;quoteAsset:string;marketCapRank:number;coinId?:string;logo?:string};
const referencePrice=113842.20;

function validPair(value:string|null){
  if(!value)return "BTC/USDT";
  const compact=value.toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(!compact.endsWith("USDT"))return "BTC/USDT";
  const base=compact.slice(0,-4);
  return /^[A-Z0-9]{2,20}$/.test(base)?`${base}/USDT`:"BTC/USDT";
}

export default function Trade(){
  const [pair,setPair]=useState("BTC/USDT");
  const [markets,setMarkets]=useState<MarketItem[]>([]);
  const [search,setSearch]=useState("");
  const [side,setSide]=useState("Buy");
  const [type,setType]=useState("Limit");
  const [price,setPrice]=useState(String(referencePrice));
  const [livePrice,setLivePrice]=useState(referencePrice);
  const [change,setChange]=useState(0);
  const [amount,setAmount]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [message,setMessage]=useState("");
  const [available,setAvailable]=useState(0);
  const symbol=binanceSymbol(pair);
  const base=pair.split("/")[0];
  const isBuy=side==="Buy";
  const accent=isBuy?"#22c55e":"#ef4444";
  const accentSoft=isBuy?"rgba(34,197,94,.14)":"rgba(239,68,68,.14)";

  useEffect(()=>{
    const requested=validPair(new URLSearchParams(window.location.search).get("pair"));
    setPair(requested);
  },[]);

  useEffect(()=>{
    let alive=true;
    async function loadMarkets(){
      try{
        const exchangeResponse=await fetch("https://api.binance.com/api/v3/exchangeInfo",{cache:"no-store"});
        if(!exchangeResponse.ok)throw new Error("Exchange data unavailable");
        const exchangeInfo=await exchangeResponse.json();
        const binancePairs=(exchangeInfo?.symbols||[]).filter((item:any)=>
          item.quoteAsset==="USDT"&&item.status==="TRADING"&&item.isSpotTradingAllowed!==false
        );
        const pairMap=new Map<string,any>();
        binancePairs.forEach((item:any)=>pairMap.set(String(item.baseAsset).toUpperCase(),item));

        let ranked:any[]=[];
        try{
          const coinResponse=await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false",{cache:"no-store"});
          if(coinResponse.ok)ranked=await coinResponse.json();
        }catch{}

        const rankedBases=new Set<string>();
        const rankedList=(Array.isArray(ranked)?ranked:[]).map((coin:any,index:number)=>{
          const baseAsset=String(coin.symbol||"").toUpperCase();
          const pairInfo=pairMap.get(baseAsset);
          if(!pairInfo)return null;
          rankedBases.add(baseAsset);
          return {symbol:pairInfo.symbol,baseAsset,quoteAsset:"USDT",marketCapRank:Number(coin.market_cap_rank||index+1),coinId:coin.id,logo:coin.image};
        }).filter(Boolean) as MarketItem[];

        const fallback=binancePairs.filter((item:any)=>!rankedBases.has(String(item.baseAsset).toUpperCase())).map((item:any,index:number)=>({
          symbol:item.symbol,baseAsset:String(item.baseAsset).toUpperCase(),quoteAsset:"USDT",marketCapRank:rankedList.length+index+1
        }));
        const list=[...rankedList,...fallback].slice(0,1000);
        if(alive)setMarkets(list);
      }catch{
        if(alive)setMarkets([]);
      }
    }
    loadMarkets();
    return()=>{alive=false};
  },[]);

  const filteredMarkets=useMemo(()=>{
    const query=search.trim().toUpperCase();
    if(!query)return markets;
    return markets.filter(item=>item.baseAsset.includes(query)||item.symbol.includes(query));
  },[markets,search]);

  useEffect(()=>{
    let alive=true;
    setMessage("");
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`).then(r=>r.json()).then(r=>{
      if(alive&&r.lastPrice){const p=Number(r.lastPrice);setLivePrice(p);setPrice(String(p));setChange(Number(r.priceChangePercent||0));}
    }).catch(()=>{});
    let ws:WebSocket|undefined;
    try{
      ws=new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);
      ws.onmessage=e=>{try{const r=JSON.parse(e.data);if(alive&&r.c){setLivePrice(Number(r.c));setChange(Number(r.P||0));}}catch{}};
    }catch{}
    return()=>{alive=false;ws?.close()};
  },[symbol]);

  useEffect(()=>{setPrice(String(livePrice));setMessage("")},[pair]);

  async function refreshBalance(){
    const supabase=createSupabaseBrowserClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setAvailable(0);return}
    const {data}=await supabase.from("account_balances").select("available").eq("user_id",user.id).eq("asset","USDT").eq("wallet","SPOT").maybeSingle();
    setAvailable(Number(data?.available||0));
  }
  useEffect(()=>{refreshBalance().catch(()=>setAvailable(0))},[]);

  const size=useMemo(()=>{const p=Number(type==="Market"?livePrice:price);const q=Number(amount);return p>0&&q>0?(p*q).toFixed(2):"0.00"},[price,amount,type,livePrice]);
  async function submit(){
    setMessage("");
    const orderPrice=type==="Market"?livePrice:Number(price);const quantity=Number(amount);
    if(!Number.isFinite(orderPrice)||orderPrice<=0||!Number.isFinite(quantity)||quantity<=0){setMessage("Enter a valid price and amount.");return}
    setSubmitting(true);
    try{const res=await fetch("/api/testnet/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({symbol:pair,side:side.toUpperCase(),type:type.toUpperCase(),price:orderPrice,quantity,clientOrderId:crypto.randomUUID()})});const data=await res.json();if(!res.ok||!data.ok)throw new Error(data.error||"Order rejected");await refreshBalance();setMessage(`Testnet order filled: ${data.order?.side||side.toUpperCase()} ${data.order?.quantity||quantity} ${base} @ ${formatPrice(orderPrice)}`);setAmount("")}catch(error){setMessage(error instanceof Error?error.message:"Order failed")}finally{setSubmitting(false)}
  }

  return <main className="app-shell"><header className="appbar"><Link className="brand" href="/"><img src="/orbitex-logo.svg" alt="ORBITEX" style={{width:30,height:30,objectFit:"contain"}}/><span>ORBITEX.</span></Link><nav><Link href="/dashboard">Dashboard</Link><Link className="active" href="/trade">Spot</Link><Link href="/futures">Futures</Link><Link href="/wallet">Wallet</Link><Link href="/orders">Orders</Link></nav><Link className="btn" href="/dashboard">Account</Link></header><div className="trade-layout"><aside className="market-list"><div className="label">MARKETS</div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search coins..." aria-label="Search coins" style={{width:"100%",margin:"12px 0",padding:"10px 11px",borderRadius:8,border:"1px solid #263244",background:"#080d14",color:"#fff",outline:"none"}}/><div className="market-count" style={{color:"#687589",fontSize:11,marginBottom:8}}>{markets.length} coins · Market cap</div><div className="market-scroll">{filteredMarkets.map(m=>{const p=displayPair(m.symbol);return <button className={p===pair?"selected":""} onClick={()=>{setPair(p);window.history.replaceState(null,"",`/trade?pair=${encodeURIComponent(m.symbol)}`)}} key={`${m.coinId||m.symbol}-${m.marketCapRank}`}><span style={{display:"inline-flex",alignItems:"center",gap:8,minWidth:0,overflow:"hidden"}}>{m.logo?<img src={m.logo} alt="" width={24} height={24} style={{borderRadius:"50%",flex:"0 0 auto"}}/>:<CoinIcon symbol={m.baseAsset} size={24}/>}<span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.baseAsset}/USDT</span></span><small style={{flex:"0 0 auto",marginLeft:6}}>{`#${m.marketCapRank}`}</small></button>})}</div></aside><section className="chart-area"><div className="trade-head"><div><div className="pair">{pair}</div><div className="price">{formatPrice(livePrice)} <span className={change<0?"danger":"up"}>{change>=0?"+":""}{change.toFixed(2)}%</span></div><div className="muted tiny">Live public market price</div></div><Link className="btn" href="/futures">Open Futures</Link></div><MarketChart pair={pair}/></section><section className="order-panel" style={{padding:22,background:"linear-gradient(180deg,#0b1420 0%,#080d14 100%)",border:"1px solid #1d3046",borderRadius:18,boxShadow:"0 18px 50px rgba(0,0,0,.22)"}}><div className="tabs" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,padding:5,background:"#070c13",border:"1px solid #1d3046",borderRadius:14,marginBottom:18}}><button type="button" className={isBuy?"on":""} onClick={()=>setSide("Buy")} style={{border:0,borderRadius:10,padding:"13px 10px",fontSize:16,fontWeight:700,cursor:"pointer",color:isBuy?"#06130b":"#8b9ab0",background:isBuy?"linear-gradient(135deg,#16a34a,#22c55e)":"transparent",boxShadow:isBuy?"0 0 22px rgba(34,197,94,.18)":"none"}}>Buy</button><button type="button" className={!isBuy?"on":""} onClick={()=>setSide("Sell")} style={{border:0,borderRadius:10,padding:"13px 10px",fontSize:16,fontWeight:700,cursor:"pointer",color:!isBuy?"#fff":"#8b9ab0",background:!isBuy?"linear-gradient(135deg,#dc2626,#ef4444)":"transparent",boxShadow:!isBuy?"0 0 22px rgba(239,68,68,.18)":"none"}}>Sell</button></div><div className="order-types" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,borderBottom:"1px solid #1d2a3b",marginBottom:22}}>{["Limit","Market"].map(t=><button type="button" className={type===t?"on":""} onClick={()=>setType(t)} key={t} style={{border:0,borderBottom:type===t?`2px solid ${accent}`:"2px solid transparent",background:"transparent",color:type===t?"#eef4ff":"#7e8da3",padding:"10px 8px 13px",fontSize:14,fontWeight:600,cursor:"pointer"}}>{t}</button>)}</div><label style={{display:"block",color:"#a9b7ca",fontSize:13,fontWeight:600,marginBottom:17}}>Price <span style={{float:"right",color:"#718198",fontWeight:400}}>USDT</span><input value={type==="Market"?formatPrice(livePrice):price} disabled={type==="Market"} onChange={e=>setPrice(e.target.value)} placeholder="0.00" style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:8,padding:"14px 15px",borderRadius:12,border:"1px solid #263b54",background:"#070c13",color:"#f1f5fb",fontSize:16,outline:"none"}}/></label><label style={{display:"block",color:"#a9b7ca",fontSize:13,fontWeight:600,marginBottom:17}}>Amount <span style={{float:"right",color:"#718198",fontWeight:400}}>{base}</span><input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:8,padding:"14px 15px",borderRadius:12,border:"1px solid #263b54",background:"#070c13",color:"#f1f5fb",fontSize:16,outline:"none"}}/></label><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginTop:-5,marginBottom:18}}>{[25,50,75,100].map(percent=><button type="button" key={percent} onClick={()=>setAmount(available>0&&Number(price)>0?((available*percent/100)/Number(price)).toString():"")} style={{border:"1px solid #263b54",background:"#0d1724",color:"#9eacc0",borderRadius:8,padding:"8px 4px",fontSize:11,cursor:"pointer"}}>{percent}%</button>)}</div><label style={{display:"block",color:"#a9b7ca",fontSize:13,fontWeight:600,marginBottom:18}}>Total <span style={{float:"right",color:"#718198",fontWeight:400}}>USDT</span><input value={size} readOnly style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:8,padding:"14px 15px",borderRadius:12,border:"1px solid #263b54",background:"#070c13",color:"#f1f5fb",fontSize:16,outline:"none"}}/></label><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderTop:"1px solid #1b2a3c",borderBottom:"1px solid #1b2a3c",marginBottom:18}}><span style={{color:"#8e9db2",fontSize:13}}>Available balance</span><strong style={{color:"#dbe6f5",fontSize:14}}>{available.toFixed(2)} USDT</strong></div>{message&&<div className="notice" style={{marginBottom:14}}>{message}</div>}<button className="btn primary full" disabled={submitting} onClick={submit} style={{width:"100%",border:0,borderRadius:12,padding:"15px 12px",fontSize:16,fontWeight:700,cursor:submitting?"not-allowed":"pointer",color:isBuy?"#06130b":"#fff",background:submitting?"#334155":`linear-gradient(135deg,${isBuy?"#16a34a":"#dc2626"},${accent})`,boxShadow:`0 8px 24px ${isBuy?"rgba(34,197,94,.18)":"rgba(239,68,68,.18)"}`}}>{submitting?"Submitting…":`${side} ${base}`}</button><p className="muted tiny" style={{lineHeight:1.6,marginTop:16}}>Testnet only. Orders are authenticated and settled through the server-side exchange ledger; no real funds are submitted.</p><Link className="muted tiny" href="/orders">View testnet order history →</Link></section></div></main>;
}
