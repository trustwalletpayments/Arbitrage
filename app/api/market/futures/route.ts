import {NextResponse} from "next/server";

export async function GET(request:Request){
 const {searchParams}=new URL(request.url);const type=searchParams.get("type")||"ticker";const symbol=(searchParams.get("symbol")||"BTCUSDT").toUpperCase();
 const endpoints:Record<string,string>={depth:`https://fapi.binance.com/fapi/v1/depth?symbol=${symbol}&limit=10`,trades:`https://fapi.binance.com/fapi/v1/aggTrades?symbol=${symbol}&limit=20`,ticker:`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`};
 if(!endpoints[type])return NextResponse.json({error:"Unsupported market data type"},{status:400});
 try{const response=await fetch(endpoints[type],{cache:"no-store"});const data=await response.json();return NextResponse.json(data,{status:response.status})}catch{return NextResponse.json({error:"Market data unavailable"},{status:502})}
}
