import {NextResponse} from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";

function sign(query: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

export async function POST(request: Request) {
  if (process.env.BINANCE_LIVE_TRADING_ENABLED !== "true") {
    return NextResponse.json({ ok: false, error: "Production spot trading is not enabled for this account yet." }, { status: 503 });
  }

  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json({ ok: false, error: "Binance production credentials are not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const symbol = String(body.symbol || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const side = body.side === "Sell" ? "SELL" : "BUY";
    const type = body.type === "Market" ? "MARKET" : body.type === "Trigger Order" ? "STOP_LOSS_LIMIT" : "LIMIT";
    const quantity = Number(body.quantity);
    const price = Number(body.price);
    const stopPrice = Number(body.stopPrice);

    if (!/^[A-Z0-9]{5,20}$/.test(symbol) || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid order details." }, { status: 400 });
    }
    if ((type === "LIMIT" || type === "STOP_LOSS_LIMIT") && (!Number.isFinite(price) || price <= 0)) {
      return NextResponse.json({ ok: false, error: "A valid limit price is required." }, { status: 400 });
    }
    if (type === "STOP_LOSS_LIMIT" && (!Number.isFinite(stopPrice) || stopPrice <= 0)) {
      return NextResponse.json({ ok: false, error: "A valid stop price is required." }, { status: 400 });
    }

    const params = new URLSearchParams({
      symbol,
      side,
      type,
      quantity: String(quantity),
      recvWindow: "5000",
      timestamp: String(Date.now()),
    });
    if (type === "LIMIT" || type === "STOP_LOSS_LIMIT") {
      params.set("price", String(price));
      params.set("timeInForce", "GTC");
    }
    if (type === "STOP_LOSS_LIMIT") params.set("stopPrice", String(stopPrice));
    params.set("signature", sign(params.toString(), apiSecret));

    const response = await fetch(`https://api.binance.com/api/v3/order?${params.toString()}`, {
      method: "POST",
      headers: { "X-MBX-APIKEY": apiKey },
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: data?.msg || "Binance rejected the order." }, { status: response.status });
    }
    return NextResponse.json({ ok: true, order: data });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to submit the order." }, { status: 500 });
  }
}
