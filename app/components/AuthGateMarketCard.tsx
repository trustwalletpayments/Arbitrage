"use client";

import { useEffect, useState } from "react";
import CoinIcon from "./CoinIcon";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";

type Props = {
  symbol: string;
  name: string;
  price: string;
  change: string;
};

export default function AuthGateMarketCard({ symbol, name, price, change }: Props) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setIsLoggedIn(Boolean(data.user));
      setAuthChecked(true);
    }).catch(() => {
      if (mounted) {
        setIsLoggedIn(false);
        setAuthChecked(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsLoggedIn(Boolean(session?.user));
      setAuthChecked(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!authChecked || !isLoggedIn) return null;

  return (
    <button type="button" className="market-card" aria-label={`Open ${symbol}/USDT market`}>
      <div className="market-card-top">
        <CoinIcon symbol={symbol} size={36} />
        <span>{symbol}/USDT</span>
      </div>
      <strong>{price}</strong>
      <em className={change.startsWith("-") ? "down" : "up"}>{change}</em>
      <div className="spark" />
    </button>
  );
}
