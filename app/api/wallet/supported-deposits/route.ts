import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_ROLE_KEY;
const walletServiceUrl = process.env.WALLET_SERVICE_URL;
const walletServiceKey = process.env.WALLET_SERVICE_API_KEY || process.env.ADMIN_API_KEY;

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function GET(request: NextRequest) {
  const missing = [
    !supabaseUrl ? "SUPABASE_URL" : null,
    !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    !walletServiceUrl ? "WALLET_SERVICE_URL" : null,
    !walletServiceKey ? "WALLET_SERVICE_API_KEY" : null,
  ].filter(Boolean);
  if (missing.length) return NextResponse.json({ error: "Wallet service is not configured.", missing }, { status: 503 });

  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const admin = createClient(supabaseUrl!, serviceRoleKey!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  try {
    const serviceUrl = normalizeUrl(walletServiceUrl!);
    const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/supported-deposits`, {
      headers: { "x-wallet-service-key": walletServiceKey! },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json().catch(() => ({ error: "Wallet service returned an invalid response." }));
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: "Wallet service connection failed.", details: error instanceof Error ? error.message : "Unknown error." }, { status: 502 });
  }
}
