import {NextResponse} from "next/server";

const BASES=["https://testnet.binancefuture.com","https://fapi.binance.com","https://fapi1.binance.com","https://fapi2.binance.com"];

export async function GET(){
  let lastError:unknown;
  for(const base of BASES){
    try{
      const response=await fetch(`${base}/fapi/v1/exchangeInfo`,{cache:"no-store",headers:{accept:"application/json"}});
      if(!response.ok)throw new Error(`Market API returned ${response.status}`);
      const data=await response.json();
      const symbols=Array.isArray(data?.symbols)?data.symbols
        .filter((item:any)=>item?.quoteAsset==="USDT"&&item?.contractType==="PERPETUAL"&&item?.status==="TRADING")
        .map((item:any)=>String(item.symbol))
        .filter(Boolean)
        .sort((a:string,b:string)=>a.localeCompare(b)):[];
      if(symbols.length)return NextResponse.json({ok:true,symbols},{headers:{"Cache-Control":"public, max-age=300"}});
      throw new Error("No USDT perpetual markets returned");
    }catch(error){lastError=error}
  }
  return NextResponse.json({ok:false,error:lastError instanceof Error?lastError.message:"Unable to load futures markets"},{status:503});
}
