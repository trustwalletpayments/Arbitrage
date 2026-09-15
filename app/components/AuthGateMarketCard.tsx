"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CoinIcon from "./CoinIcon";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";

type Props = {
  symbol: string;
  name: string;
  price: string;
  change: string;
};

export default function AuthGateMarketCard({ symbol, name, price, change }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const openMarket = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      const tradeHref = `/trade?pair=${encodeURIComponent(`${symbol}/USDT`)}`;
      router.push(data.user ? tradeHref : `/login?next=${encodeURIComponent(tradeHref)}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <button type="button" className="market-card" onClick={openMarket} aria-label={`Open ${symbol}/USDT market`}>
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
