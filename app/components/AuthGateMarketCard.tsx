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

type Ticker = {
  lastPrice: string;
  priceChangePercent: string;
};

function formatPrice(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1000) {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (value >= 1) {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  }
  if (value >= 0.01) {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
  }
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 10 })}`;
}

export default function AuthGateMarketCard({ symbol, price, change }: Props) {
  const router = useRouter();
  const [livePrice, setLivePrice] = useState(price);
  const [liveChange, setLiveChange] = useState(change);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let active = true;
    const symbolPair = `${symbol}USDT`;

    const loadTicker = async () => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbolPair}`, { cache: "no-store" });
        if (!response.ok) return;
        const ticker = (await response.json()) as Ticker;
        if (!active) return;
        const numericPrice = Number(ticker.lastPrice);
        const numericChange = Number(ticker.priceChangePercent);
        setLivePrice(formatPrice(numericPrice));
        setLiveChange(`${numericChange >= 0 ? "+" : ""}${numericChange.toFixed(2)}%`);
      } catch {
        // Keep the last known price if the public market endpoint is temporarily unavailable.
      }
    };

    loadTicker();
    const interval = window.setInterval(loadTicker, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [symbol, price]);

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
      <strong>{livePrice}</strong>
      <em className={liveChange.startsWith("-") ? "down" : "up"}>{liveChange}</em>
      <div className="spark" />
    </button>
  );
}
