import {NextRequest,NextResponse} from "next/server";

export async function GET(request:NextRequest){
  const symbol=(request.nextUrl.searchParams.get("symbol")||"BTCUSDT").toUpperCase().replace(/[^A-Z0-9]/g,"");
  const kind=request.nextUrl.searchParams.get("kind")||"ticker";
  const endpoint=kind==="depth"?`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=12`:kind==="trades"?`https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=20`:`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
  try{
    const response=await fetch(endpoint,{cache:"no-store"});
    const data=await response.json();
    return NextResponse.json(data,{status:response.status});
  }catch{
    return NextResponse.json({error:"Unable to load spot market data"},{status:502});
  }
}
