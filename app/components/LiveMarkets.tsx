"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice, formatVolume } from "../../lib/market-data";
import CoinIcon from "./CoinIcon";

type Coin = {
  id: string;
  name: string;
  symbol: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  total_volume: number | null;
  market_cap_rank: number | null;
};

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
};

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

async function loadCoinGecko(): Promise<Coin[]> {
  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h&locale=en";
  try {
    return await requestJson<Coin[]>(url);
  } catch {
    await sleep(900);
    return requestJson<Coin[]>(url);
  }
}

async function loadBinanceFallback(): Promise<Coin[]> {
  const tickers = await requestJson<BinanceTicker[]>("https://api.binance.com/api/v3/ticker/24hr");
  return tickers
    .filter((ticker) => ticker.symbol.endsWith("USDT") && Number(ticker.quoteVolume) > 0)
    .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume))
    .slice(0, 100)
    .map((ticker, index) => {
      const symbol = ticker.symbol.slice(0, -4).toUpperCase();
      return {
        id: `binance-${ticker.symbol.toLowerCase()}`,
        name: symbol,
        symbol,
        current_price: Number(ticker.lastPrice),
        price_change_percentage_24h: Number(ticker.priceChangePercent),
        total_volume: Number(ticker.quoteVolume),
        market_cap_rank: index + 1,
      };
    });
}

export default function LiveMarkets() {
  const router = useRouter();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [query, setQuery] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadMarkets() {
      setLoading(true);
      try {
        let data: Coin[];
        try {
          data = await loadCoinGecko();
        } catch {
          data = await loadBinanceFallback();
        }

        if (!alive) return;
        setCoins(data);
        setConnected(data.length > 0);
      } catch {
        if (alive) setConnected(false);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadMarkets();
    const timer = window.setInterval(loadMarkets, 60_000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const filteredCoins = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return coins;
    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(value) ||
        coin.symbol.toLowerCase().includes(value) ||
        coin.id.toLowerCase().includes(value),
    );
  }, [coins, query]);

  function openTrade(coin: Coin) {
    const pair = `${coin.symbol.toUpperCase()}USDT`;
    router.push(`/trade?pair=${encodeURIComponent(pair)}`);
  }

  return (
    <div className="panel">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <div className="live-status" style={{ marginBottom: 0 }}>
          <span className={connected ? "status-dot" : "status-dot offline"} />
          {loading ? "Loading market data…" : connected ? "Live market feed" : "Market feed unavailable"}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search coins or symbols…"
          aria-label="Search coins or symbols"
          style={{ width: "min(360px, 100%)", border: "1px solid #24415f", borderRadius: 12, background: "#0b1725", color: "#f4f7fb", padding: "12px 14px", outline: "none", fontSize: 14 }}
        />
      </div>

      <div style={{ color: "#8da0b8", fontSize: 13, marginBottom: 12 }}>
        Showing {filteredCoins.length.toLocaleString()} of {coins.length.toLocaleString()} top coins by market cap
      </div>

      <div className="markets-table-wrap" style={{ overflowX: "auto" }}>
        <table className="table markets-table">
          <thead>
            <tr><th>#</th><th>Pair</th><th>Last price</th><th>24h change</th><th>24h volume</th><th /></tr>
          </thead>
          <tbody>
            {filteredCoins.map((coin) => {
              const symbol = coin.symbol.toUpperCase();
              const pair = `${symbol}USDT`;
              const change = coin.price_change_percentage_24h ?? 0;
              return (
                <tr key={coin.id} className="market-row-clickable" onClick={() => openTrade(coin)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openTrade(coin); } }} tabIndex={0} role="link" aria-label={`Trade ${symbol} USDT`}>
                  <td>{coin.market_cap_rank ?? "—"}</td>
                  <td><span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><CoinIcon symbol={symbol} size={30} /><span><strong>{symbol}/USDT</strong><small style={{ display: "block", color: "#71849d", marginTop: 3 }}>{coin.name}</small></span></span></td>
                  <td>{coin.current_price == null ? "—" : formatPrice(coin.current_price)}</td>
                  <td className={change < 0 ? "danger" : "up"}>{coin.price_change_percentage_24h == null ? "—" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}</td>
                  <td>{coin.total_volume == null ? "—" : formatVolume(coin.total_volume)}</td>
                  <td><Link className="btn market-trade-button" href={`/trade?pair=${encodeURIComponent(pair)}`} onClick={(event) => event.stopPropagation()}>Trade</Link></td>
                </tr>
              );
            })}
            {!loading && filteredCoins.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: "#8da0b8" }}>No coins found. Try another name or symbol.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
