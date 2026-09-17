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

function normalizeWalletServiceUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function POST(request: NextRequest) {
  const missing = [
    !supabaseUrl ? "SUPABASE_URL" : null,
    !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    !walletServiceUrl ? "WALLET_SERVICE_URL" : null,
    !walletServiceKey ? "WALLET_SERVICE_API_KEY" : null,
  ].filter((value): value is string => Boolean(value));

  if (missing.length) {
    return NextResponse.json(
      { error: "Wallet provisioning is not configured.", missing },
      { status: 503 }
    );
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

  const serviceUrl = normalizeWalletServiceUrl(walletServiceUrl);
  const endpoint = `${serviceUrl.replace(/\/$/, "")}/provision/${data.user.id}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-wallet-service-key": walletServiceKey,
      },
      body: JSON.stringify({ asset, network }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const result = await response.json().catch(() => ({ error: "Wallet service returned an invalid response." }));
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause : null;
    return NextResponse.json(
      {
        error: "Wallet service connection failed.",
        details: error instanceof Error ? error.message : "Unknown fetch error.",
        cause: cause?.message || null,
        causeCode: cause && typeof cause === "object" && "code" in cause ? String((cause as { code?: unknown }).code) : null,
        endpointHost: (() => { try { return new URL(serviceUrl).host; } catch { return "invalid-url"; } })(),
      },
      { status: 502 }
    );
  }
}
