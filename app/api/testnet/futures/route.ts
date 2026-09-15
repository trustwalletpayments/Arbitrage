import {NextResponse} from "next/server";
import {estimatedLiquidationPrice,initialMargin,notional,unrealizedPnl,validateOrder} from "../../../../lib/trading";

export async function GET(request:Request){
  const params=new URL(request.url).searchParams;
  const symbol=(params.get("symbol")||"BTCUSDT").toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(params.get("market")==="1"){
    try{
      const [depth,recentTrades,dailyTicker,funding]=await Promise.all([
        fetch(`https://fapi.binance.com/fapi/v1/depth?symbol=${encodeURIComponent(symbol)}&limit=12`,{cache:"no-store"}).then(async r=>{if(!r.ok)throw new Error("Order book unavailable");return r.json()}),
        fetch(`https://fapi.binance.com/fapi/v1/aggTrades?symbol=${encodeURIComponent(symbol)}&limit=20`,{cache:"no-store"}).then(async r=>{if(!r.ok)throw new Error("Trades unavailable");return r.json()}),
        fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${encodeURIComponent(symbol)}`,{cache:"no-store"}).then(async r=>{if(!r.ok)throw new Error("Ticker unavailable");return r.json()}),
        fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${encodeURIComponent(symbol)}`,{cache:"no-store"}).then(async r=>{if(!r.ok)throw new Error("Funding data unavailable");return r.json()})
      ]);
      return NextResponse.json({ok:true,symbol,depth,recentTrades,dailyTicker,funding},{headers:{"Cache-Control":"no-store"}});
    }catch(error){
      return NextResponse.json({ok:false,error:error instanceof Error?error.message:"Unable to load market data"},{status:503});
    }
  }
  const providers=[
    `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${encodeURIComponent(symbol)}`,
    `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${encodeURIComponent(symbol)}`,
    `https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`
  ];
  for(const url of providers){
    try{
      const response=await fetch(url,{cache:"no-store",headers:{accept:"application/json"}});
      if(!response.ok)continue;
      const data=await response.json();
      const price=Number(data.markPrice??data.price);
      if(Number.isFinite(price)&&price>0)return NextResponse.json({ok:true,symbol,markPrice:price});
    }catch{}
  }
  return NextResponse.json({ok:false,error:"Unable to load live mark price"},{status:503});
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
