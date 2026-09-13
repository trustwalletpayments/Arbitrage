"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LiveMarkets from "../components/LiveMarkets";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

export default function Markets() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email || "");
      setCheckedAuth(true);
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setEmail(session?.user?.email || "");
      setCheckedAuth(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setEmail("");
    router.refresh();
  };

  const initials = (email.split("@")[0] || "U").slice(0, 1).toUpperCase();

  return (
    <main className="app-shell">
      <header className="appbar">
        <Link className="brand" href="/">
          <img src="/orbitex-logo.svg" alt="ORBITEX" style={{ width: 30, height: 30, objectFit: "contain" }} />
          <span>ORBITEX.</span>
        </Link>
        <nav>
          <Link className="active" href="/markets">Markets</Link>
          <Link href="/trade">Spot</Link>
          <Link href="/futures">Futures</Link>
          <Link href="/wallet">Wallet</Link>
        </nav>
        <div className="actions">
          {!checkedAuth ? null : email ? (
            <>
              <Link className="btn" href="/dashboard">{initials} · Account</Link>
              <button className="btn primary" type="button" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <Link className="btn" href="/login">Log in</Link>
              <Link className="btn primary" href="/signup">Sign up</Link>
            </>
          )}
        </div>
      </header>
      <section className="app-content">
        <div className="page-title">
          <div>
            <div className="eyebrow">LIVE MARKET DATA</div>
            <h1>Markets</h1>
            <p className="muted">Real-time public market prices and 24h statistics. Trading remains testnet-only.</p>
          </div>
        </div>
        <LiveMarkets />
      </section>
    </main>
  );
}
