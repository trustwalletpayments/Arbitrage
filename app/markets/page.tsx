"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LiveMarkets from "../components/LiveMarkets";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";

export default function Markets() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        router.replace("/login?next=/markets");
        return;
      }
      setAuthChecked(true);
    }).catch(() => {
      if (mounted) router.replace("/login?next=/markets");
    });

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!authChecked) {
    return <main className="app-shell" />;
  }

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
