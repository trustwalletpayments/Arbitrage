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
  if (!supabaseUrl || !serviceRoleKey || !walletServiceUrl || !walletServiceKey) {
    return NextResponse.json({ error: "Wallet provisioning is not configured." }, { status: 503 });
  }

  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const asset = String(body?.asset || "").trim().toUpperCase();
  const network = String(body?.network || "").trim().toLowerCase();
  if (!asset || !network) return NextResponse.json({ error: "Asset and network are required." }, { status: 400 });

  const response = await fetch(`${walletServiceUrl.replace(/\/$/, "")}/provision/${data.user.id}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-wallet-service-key": walletServiceKey,
    },
    body: JSON.stringify({ asset, network }),
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({ error: "Wallet service returned an invalid response." }));
  return NextResponse.json(result, { status: response.status });
}
