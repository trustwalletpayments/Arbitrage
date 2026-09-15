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

export async function GET(request:Request){
  const params=new URL(request.url).searchParams;
  const symbol=(params.get("symbol")||"BTCUSDT").toUpperCase().replace(/[^A-Z0-9]/g,"");
  try{
    if(params.get("market")==="1"){
      const [depth,recentTrades,dailyTicker,funding]=await Promise.all([
        getJson(`/fapi/v1/depth?symbol=${encodeURIComponent(symbol)}&limit=12`),
        getJson(`/fapi/v1/aggTrades?symbol=${encodeURIComponent(symbol)}&limit=20`),
        getJson(`/fapi/v1/ticker/24hr?symbol=${encodeURIComponent(symbol)}`),
        getJson(`/fapi/v1/premiumIndex?symbol=${encodeURIComponent(symbol)}`)
      ]);
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
