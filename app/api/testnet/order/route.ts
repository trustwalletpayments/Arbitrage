import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { validateOrder } from "../../../../lib/trading";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    validateOrder(body);

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });

    const symbol = String(body.symbol || "BTC/USDT");
    const side = body.side === "SELL" ? "SELL" : "BUY";
    const type = body.type === "MARKET" ? "MARKET" : "LIMIT";
    const price = Number(body.price);
    const quantity = Number(body.quantity);
    const clientOrderId = body.clientOrderId ? String(body.clientOrderId) : crypto.randomUUID();

    const { data, error } = await supabase.rpc("execute_testnet_spot_order", {
      p_user_id: user.id,
      p_market: symbol,
      p_side: side,
      p_type: type,
      p_price: price,
      p_quantity: quantity,
      p_client_order_id: clientOrderId,
    });

    if (error) throw new Error(error.message);
    const result = data as { order?: Record<string, unknown>; message?: string; fee?: number; replayed?: boolean };
    return NextResponse.json({ ok: true, order: result.order, fee: result.fee, replayed: result.replayed, testnet: true, message: result.message || "Testnet order filled." });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid order" }, { status: 400 });
  }
}
