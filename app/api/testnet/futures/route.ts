import {NextResponse} from "next/server";
import {estimatedLiquidationPrice,initialMargin,notional,unrealizedPnl,validateOrder} from "../../../../../lib/trading";

export async function POST(request:Request){
  try{
    const body=await request.json();
    const entry=Number(body.entryPrice),quantity=Number(body.quantity),leverage=Number(body.leverage||1),mark=Number(body.markPrice||entry),side=body.side==="SHORT"?"SHORT":"LONG";
    validateOrder({price:entry,quantity,leverage});
    const position={id:crypto.randomUUID(),symbol:String(body.symbol||"BTC/USDT"),side,entryPrice:entry,markPrice:mark,quantity,leverage,notional:notional(entry,quantity),margin:initialMargin(entry,quantity,leverage),unrealizedPnl:unrealizedPnl(side,entry,mark,quantity),liquidationPrice:estimatedLiquidationPrice(side,entry,leverage),testnet:true};
    return NextResponse.json({ok:true,position,message:"Testnet futures position calculated. No real position or funds were opened."});
  }catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:"Invalid position"},{status:400})}
}
