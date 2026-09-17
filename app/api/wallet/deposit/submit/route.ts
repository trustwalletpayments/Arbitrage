import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SECRET_ROLE_KEY;
const walletServiceUrl = process.env.WALLET_SERVICE_URL;
const walletServiceKey =
  process.env.WALLET_SERVICE_API_KEY || process.env.ADMIN_API_KEY;

export async function POST(request: NextRequest) {
  const missing: string[] = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!walletServiceUrl) missing.push("WALLET_SERVICE_URL");
  if (!walletServiceKey) missing.push("WALLET_SERVICE_API_KEY");

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "Wallet verification is not configured.",
        missing,
      },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error: userError } = await admin.auth.getUser(accessToken);
  if (userError || !data.user) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount);
  const txHash = String(body?.txHash || "").trim().toLowerCase();
  if (!Number.isFinite(amount) || amount <= 0 || !/^0x[a-f0-9]{64}$/.test(txHash)) {
    return NextResponse.json(
      { error: "Enter a valid amount and transaction hash." },
      { status: 400 },
    );
  }

  const response = await fetch(`${walletServiceUrl.replace(/\/$/, "")}/verify-deposit`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-wallet-service-key": walletServiceKey,
    },
    body: JSON.stringify({ userId: data.user.id, amount, txHash }),
    cache: "no-store",
  });

  const result = await response
    .json()
    .catch(() => ({ error: "Wallet service returned an invalid response." }));
  return NextResponse.json(result, { status: response.status });
}
