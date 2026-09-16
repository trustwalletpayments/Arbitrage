import {NextResponse} from "next/server";
import {estimatedLiquidationPrice,initialMargin,notional,unrealizedPnl,validateOrder} from "../../../../lib/trading";

const API_BASES=["https://testnet.binancefuture.com","https://fapi.binance.com"];

async function getJson(path:string){
  let lastError:unknown;
  for(const base of API_BASES){
    try{
      const response=await fetch(`${base}${path}`,{cache:"no-store",headers:{accept:"application/json"}});
      if(!response.ok){lastError=new Error(`Market API returned ${response.status}`);continue}
      return await response.json();
    }catch(error){lastError=error}
  }
  throw lastError instanceof Error?lastError:new Error("Market API unavailable");
}

async function getPublicSpotJson(path:string){
  const response=await fetch(`https://api.binance.com${path}`,{cache:"no-store",headers:{accept:"application/json"}});
  if(!response.ok)throw new Error(`Public market API returned ${response.status}`);
  return response.json();
}

async function getBybitJson(path:string){
  const response=await fetch(`https://api.bybit.com${path}`,{cache:"no-store",headers:{accept:"application/json"}});
  if(!response.ok)throw new Error(`Bybit market API returned ${response.status}`);
  const data=await response.json();
  if(data?.retCode!==0)throw new Error(data?.retMsg||"Bybit market API unavailable");
  return data.result;
}

async function getOptionalJson(paths:string[],spotPaths:string[]=[]){
  for(const path of paths){
    try{return await getJson(path)}catch{}
  }
  for(const path of spotPaths){
    try{return await getPublicSpotJson(path)}catch{}
  }
  return [];
}

async function getDepth(symbol:string){
  try{return await getJson(`/fapi/v1/depth?symbol=${encodeURIComponent(symbol)}&limit=12`)}catch{}
  try{return await getPublicSpotJson(`/api/v3/depth?symbol=${encodeURIComponent(symbol)}&limit=12`)}catch{}
  try{
    const data=await getBybitJson(`/v5/market/orderbook?category=linear&symbol=${encodeURIComponent(symbol)}&limit=25`);
    return {bids:Array.isArray(data?.b)?data.b:[],asks:Array.isArray(data?.a)?data.a:[]};
  }catch{}
  return {bids:[],asks:[]};
}

async function getRecentTrades(symbol:string){
  const binance=await getOptionalJson([
    `/fapi/v1/aggTrades?symbol=${encodeURIComponent(symbol)}&limit=20`,
    `/fapi/v1/trades?symbol=${encodeURIComponent(symbol)}&limit=20`
  ],[
    `/api/v3/aggTrades?symbol=${encodeURIComponent(symbol)}&limit=20`,
    `/api/v3/trades?symbol=${encodeURIComponent(symbol)}&limit=20`
  ]);
  if(Array.isArray(binance)&&binance.length)return binance;
  try{
    const data=await getBybitJson(`/v5/market/recent-trade?category=linear&symbol=${encodeURIComponent(symbol)}&limit=20`);
    return Array.isArray(data?.list)?data.list.map((trade:any)=>({
      p:trade.price,
      q:trade.size,
      T:Number(trade.time||Date.now()),
      isBuyerMaker:trade.side!=="Buy"
    })):[];
  }catch{return []}
}

export async function GET(request:Request){
  const params=new URL(request.url).searchParams;
  const symbol=(params.get("symbol")||"BTCUSDT").toUpperCase().replace(/[^A-Z0-9]/g,"");
  try{
    if(params.get("market")==="1"){
      const [depthResult,tradesResult,tickerResult,fundingResult]=await Promise.allSettled([
        getDepth(symbol),
        getRecentTrades(symbol),
        getJson(`/fapi/v1/ticker/24hr?symbol=${encodeURIComponent(symbol)}`),
        getJson(`/fapi/v1/premiumIndex?symbol=${encodeURIComponent(symbol)}`)
      ]);
      const depth=depthResult.status==="fulfilled"&&depthResult.value?depthResult.value:{bids:[],asks:[]};
      const recentTrades=tradesResult.status==="fulfilled"&&Array.isArray(tradesResult.value)?tradesResult.value:[];
      const dailyTicker=tickerResult.status==="fulfilled"?tickerResult.value:{};
      const funding=fundingResult.status==="fulfilled"?fundingResult.value:{};
      if(!Object.keys(dailyTicker).length&&!Object.keys(funding).length&&!recentTrades.length&&!depth.bids?.length&&!depth.asks?.length){
        throw new Error("Market data unavailable");
      }
      return NextResponse.json({ok:true,symbol,depth,recentTrades,dailyTicker,funding},{headers:{"Cache-Control":"no-store, max-age=0"}});
    }

    const [ticker,funding]=await Promise.all([
      getJson(`/fapi/v1/ticker/24hr?symbol=${encodeURIComponent(symbol)}`),
      getJson(`/fapi/v1/premiumIndex?symbol=${encodeURIComponent(symbol)}`)
    ]);
    const markPrice=Number(funding.markPrice??ticker.lastPrice??ticker.price);
    if(!Number.isFinite(markPrice)||markPrice<=0)throw new Error("Invalid mark price");
    return NextResponse.json({
      ok:true,
      symbol,
      markPrice,
      lastPrice:Number(ticker.lastPrice??markPrice),
      priceChange:Number(ticker.priceChange??0),
      priceChangePercent:Number(ticker.priceChangePercent??0),
      fundingRate:Number(funding.lastFundingRate??0),
      volume:Number(ticker.volume??0),
      quoteVolume:Number(ticker.quoteVolume??0),
      nextFundingTime:Number(funding.nextFundingTime??0)
    },{headers:{"Cache-Control":"no-store, max-age=0"}});
  }catch(error){
    return NextResponse.json({ok:false,error:error instanceof Error?error.message:"Unable to load live market data"},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}

export async function POST(request:Request){
  try{
    const body=await request.json();
    const entry=Number(body.entryPrice),quantity=Number(body.quantity),leverage=Number(body.leverage||1),mark=Number(body.markPrice||entry),side=body.side==="SHORT"?"SHORT":"LONG";
    const takeProfit=body.takeProfit===undefined||body.takeProfit===""?undefined:Number(body.takeProfit);
    const stopLoss=body.stopLoss===undefined||body.stopLoss===""?undefined:Number(body.stopLoss);
    validateOrder({price:entry,quantity,leverage});
    if(!Number.isFinite(mark)||mark<=0)throw new Error("Mark price must be positive");
    if(takeProfit!==undefined&&(!Number.isFinite(takeProfit)||takeProfit<=0))throw new Error("Take profit must be positive");
    if(stopLoss!==undefined&&(!Number.isFinite(stopLoss)||stopLoss<=0))throw new Error("Stop loss must be positive");
    if(side==="LONG"){
      if(takeProfit!==undefined&&takeProfit<=entry)throw new Error("For a long position, take profit must be above entry price");
      if(stopLoss!==undefined&&stopLoss>=entry)throw new Error("For a long position, stop loss must be below entry price");
    }else{
      if(takeProfit!==undefined&&takeProfit>=entry)throw new Error("For a short position, take profit must be below entry price");
      if(stopLoss!==undefined&&stopLoss<=entry)throw new Error("For a short position, stop loss must be above entry price");
    }
    const liquidationPrice=estimatedLiquidationPrice(side,entry,leverage);
    const position={id:crypto.randomUUID(),symbol:String(body.symbol||"BTC/USDT"),side,entryPrice:entry,markPrice:mark,quantity,leverage,notional:notional(entry,quantity),margin:initialMargin(entry,quantity,leverage),unrealizedPnl:unrealizedPnl(side,entry,mark,quantity),liquidationPrice,takeProfit,stopLoss,status:"OPEN",testnet:true};
    return NextResponse.json({ok:true,position,message:"Testnet futures position calculated. No real position or funds were opened."});
  }catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:"Invalid position"},{status:400})}
}
