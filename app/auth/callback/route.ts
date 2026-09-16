import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") || "email";
  const nextParam = url.searchParams.get("next") || "/dashboard";
  const loginUrl = new URL("/login", url.origin);

  if (url.searchParams.get("error")) {
    loginUrl.searchParams.set("error", "confirmation_failed");
    return NextResponse.redirect(loginUrl);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    loginUrl.searchParams.set("error", "auth_config");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  let error: Error | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else if (tokenHash) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "recovery" | "invite" | "magiclink" | "email_change",
    });
    error = result.error;
  } else {
    error = new Error("Missing confirmation token.");
  }

  if (error) {
    loginUrl.searchParams.set("error", "confirmation_failed");
    return NextResponse.redirect(loginUrl);
  }

  const safeNext = nextParam.startsWith("/") && !nextParam.startsWith("//")
    ? nextParam
    : "/dashboard";

  loginUrl.searchParams.set("confirmed", "1");
  loginUrl.searchParams.set("next", safeNext);
  return NextResponse.redirect(loginUrl);
}
