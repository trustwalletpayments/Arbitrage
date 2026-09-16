import {NextResponse} from "next/server";

const BASES=["https://testnet.binancefuture.com","https://fapi.binance.com","https://fapi1.binance.com","https://fapi2.binance.com"];
const COINGECKO="https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=";

type FuturesSymbol={symbol:string;base:string;marketCap:number;rank:number};

async function loadBinance(base:string){
  const response=await fetch(`${base}/fapi/v1/exchangeInfo`,{cache:"no-store",headers:{accept:"application/json"}});
  if(!response.ok)throw new Error(`Market API returned ${response.status}`);
  const data=await response.json();
  return Array.isArray(data?.symbols)?data.symbols
    .filter((item:any)=>item?.quoteAsset==="USDT"&&item?.contractType==="PERPETUAL"&&item?.status==="TRADING")
    .map((item:any)=>({symbol:String(item.symbol),base:String(item.baseAsset||item.symbol.replace(/USDT$/,"")),marketCap:0,rank:999999}))
    .filter((item:FuturesSymbol)=>item.symbol):[];
}

async function loadMarketCaps(){
  const pages=Array.from({length:8},(_,i)=>i+1);
  const results=await Promise.all(pages.map(async page=>{
    const response=await fetch(`${COINGECKO}${page}&sparkline=false`,{next:{revalidate:600},headers:{accept:"application/json","user-agent":"Orbitex-Futures/1.0"}});
    if(!response.ok)throw new Error(`CoinGecko returned ${response.status}`);
    return response.json();
  }));
  const map=new Map<string,{marketCap:number;rank:number}>();
  for(const coins of results){
    if(!Array.isArray(coins))continue;
    for(const coin of coins){
      const key=String(coin?.symbol||"").toUpperCase();
      if(!key)continue;
      const marketCap=Number(coin?.market_cap)||0;
      const rank=Number(coin?.market_cap_rank)||999999;
      const previous=map.get(key);
      if(!previous||marketCap>previous.marketCap)map.set(key,{marketCap,rank});
    }
  }
  return map;
}

function capKey(base:string){
  const normalized=base.toUpperCase();
  return normalized.replace(/^1000/,'').replace(/^1000000/,'');
}

export async function GET(){
  let lastError:unknown;
  for(const base of BASES){
    try{
      const futures=await loadBinance(base);
      if(!futures.length)throw new Error("No USDT perpetual markets returned");
      let caps=new Map<string,{marketCap:number;rank:number}>();
      try{caps=await loadMarketCaps()}catch{caps=new Map()}

      const symbols=futures.map(item=>{
        const cap=caps.get(capKey(item.base));
        return {...item,marketCap:cap?.marketCap||0,rank:cap?.rank||999999};
      }).sort((a:FuturesSymbol,b:FuturesSymbol)=>{
        if(a.marketCap!==b.marketCap)return b.marketCap-a.marketCap;
        if(a.rank!==b.rank)return a.rank-b.rank;
        return a.symbol.localeCompare(b.symbol);
      });

      return NextResponse.json({
        ok:true,
        symbols:symbols.map(item=>item.symbol),
        markets:symbols,
        source:"Binance USDT perpetuals · CoinGecko market-cap ranking",
        marketCapUniverse:2000,
      },{headers:{"Cache-Control":"public, max-age=600, stale-while-revalidate=1200"}});
    }catch(error){lastError=error}
  }
  return NextResponse.json({ok:false,error:lastError instanceof Error?lastError.message:"Unable to load futures markets"},{status:503});
}
