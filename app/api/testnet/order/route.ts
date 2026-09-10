import {NextResponse} from "next/server";
import {validateOrder} from "../../../../lib/trading";

export async function POST(request:Request){
  try{
    const body=await request.json();
    validateOrder(body);
    const order={id:crypto.randomUUID(),symbol:String(body.symbol||"BTC/USDT"),side:body.side==="SELL"?"SELL":"BUY",type:body.type==="MARKET"?"MARKET":"LIMIT",price:Number(body.price),quantity:Number(body.quantity),status:"FILLED",createdAt:new Date().toISOString(),testnet:true};
    return NextResponse.json({ok:true,order,message:"Testnet order accepted. No real funds or market order were submitted."});
  }catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:"Invalid order"},{status:400})}
}
