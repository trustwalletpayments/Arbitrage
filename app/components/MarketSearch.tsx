"use client";

import { useEffect, useMemo, useState } from "react";
import CoinIcon from "./CoinIcon";
import { MARKET_SYMBOLS, displayPair } from "../../lib/market-data";

type Props = { selectedPair: string; onSelect: (pair: string) => void };

type Sentiment = { value: number; classification: string; timestamp?: string; yesterday?: number; weekAgo?: number };

function sentimentLabel(value: number) {
  if (value <= 24) return "EXTREME FEAR";
  if (value <= 44) return "FEAR";
  if (value <= 55) return "NEUTRAL";
  if (value <= 74) return "GREED";
  return "EXTREME GREED";
}

export default function MarketSearch({ selectedPair, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [symbols, setSymbols] = useState<string[]>([...MARKET_SYMBOLS]);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [sentimentError, setSentimentError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/testnet/markets", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data?.symbols) && data.symbols.length > 0) setSymbols(data.symbols);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadSentiment = async () => {
      try {
        const response = await fetch(`https://api.alternative.me/fng/?limit=8&_=${Date.now()}`, { cache: "no-store" });
        const data = await response.json();
        const items = Array.isArray(data?.data) ? data.data : [];
        const item = items[0];
        const value = Number(item?.value);
        if (!cancelled && Number.isFinite(value)) {
          const yesterday = Number(items[1]?.value);
          const weekAgo = Number(items[7]?.value);
          setSentiment({ value, classification: item?.value_classification || sentimentLabel(value), timestamp: item?.timestamp, yesterday: Number.isFinite(yesterday) ? yesterday : undefined, weekAgo: Number.isFinite(weekAgo) ? weekAgo : undefined });
          setSentimentError(false);
        } else if (!cancelled) setSentimentError(true);
      } catch {
        if (!cancelled) setSentimentError(true);
      }
    };
    loadSentiment();
    const timer = window.setInterval(loadSentiment, 5 * 60 * 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const markets = useMemo(() => {
    const normalized = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return symbols.filter((symbol) => !normalized || symbol.includes(normalized));
  }, [query, symbols]);

  const value = sentiment?.value ?? 0;
  const needleRotation = -90 + value * 1.8;
  const updated = sentiment?.timestamp ? new Date(Number(sentiment.timestamp) * 1000).toLocaleDateString() : "—";
  const yesterdayChange = sentiment?.yesterday !== undefined ? value - sentiment.yesterday : undefined;
  const weekChange = sentiment?.weekAgo !== undefined ? value - sentiment.weekAgo : undefined;
  const formatChange = (change?: number) => change === undefined ? "—" : `${change >= 0 ? "+" : ""}${change}`;

  return (
    <>
      <style>{`
        .market-search-wrap{display:flex;flex-direction:column;min-height:0;width:100%;}
        .market-search-box{flex:0 0 auto;}
        .market-search-results{display:flex;flex-direction:column;gap:8px;min-height:0;max-height:calc(100vh - 230px);overflow-y:auto;overflow-x:hidden;padding:10px 4px 10px 0;scrollbar-width:thin;overscroll-behavior:contain;}
        .market-search-results::-webkit-scrollbar{width:8px;}
        .market-search-results::-webkit-scrollbar-thumb{background:#30445d;border-radius:999px;}
        .market-search-results button{display:flex;align-items:center;gap:12px;width:100%;min-height:58px;flex:0 0 auto;padding:10px 14px;border:1px solid #203b56;border-radius:14px;background:#0d1c2d;color:#c5d3e3;font:inherit;font-size:16px;cursor:pointer;box-sizing:border-box;transition:background .15s ease,border-color .15s ease,transform .15s ease;}
        .market-search-results button:hover{background:#142b45;border-color:#315b83;}
        .market-search-results button.selected{background:#16395d;border-color:#3b9cff;color:#fff;box-shadow:inset 3px 0 #3b9cff;}
        .market-coin-icon{display:flex;align-items:center;justify-content:center;flex:0 0 40px;width:40px;height:40px;min-width:40px;}
        .market-coin-icon .coin-logo{display:flex!important;align-items:center;justify-content:center;flex:0 0 30px;width:30px!important;height:30px!important;line-height:0;}
        .market-coin-icon .coin-logo img{display:block;width:30px!important;height:30px!important;object-fit:contain;}
        .market-coin-icon .coin-logo b{font-size:14px;line-height:1;}
        .market-coin-name{min-width:0;flex:1;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .market-search-empty{padding:24px 12px;text-align:center;color:#7890a8;}
        .fear-greed-card{grid-column:1!important;grid-row:6!important;width:100%!important;min-height:500px!important;box-sizing:border-box!important;padding:24px 20px!important;border:1px solid #24445f!important;border-radius:24px!important;background:linear-gradient(160deg,#0b1b2b,#081522)!important;box-shadow:0 16px 36px rgba(0,0,0,.18);overflow:hidden;color:#dbeafe;}
        .fear-greed-head{display:flex;align-items:flex-start;justify-content:space-between;gap:6px}.fear-greed-kicker{font-size:9px;letter-spacing:.1em;color:#7890a8}.fear-greed-title{margin:6px 0 0;font-size:15px;line-height:1.1;font-weight:800;color:#f1f6ff;white-space:nowrap}.fear-greed-badge{padding:6px 9px;border:1px solid #294963;border-radius:999px;color:#9eb4c9;font-size:10px;white-space:nowrap}
        .fear-greed-gauge{position:relative;width:100%;height:154px;margin:12px 0 0;overflow:visible}.fear-greed-arc{position:absolute;left:50%;bottom:18px;width:min(166px,calc(100% - 6px));height:min(166px,calc(100% - 6px));transform:translateX(-50%);border-radius:50%;background:conic-gradient(from 270deg,#ff405b 0deg,#ff9f32 60deg,#ffe14a 125deg,#8ddc63 165deg,#26d98b 180deg);}.fear-greed-arc:after{content:"";position:absolute;inset:17px;border-radius:50%;background:#0a1828}.fear-greed-needle{position:absolute;left:50%;bottom:18px;width:3px;height:58px;transform-origin:50% 100%;transform:translateX(-50%) rotate(var(--needle));border-radius:99px;background:#b9fff1;box-shadow:0 0 10px #52e6c4}.fear-greed-needle:before{content:"";position:absolute;top:-5px;left:50%;width:11px;height:11px;transform:translateX(-50%);border-radius:50%;background:#eaffff;box-shadow:0 0 10px #8effe2}.fear-greed-score{position:absolute;left:0;right:0;bottom:39px;text-align:center;font-size:34px;line-height:1;font-weight:850;color:#f5f9ff}.fear-greed-state{position:absolute;left:0;right:0;bottom:20px;text-align:center;font-size:12px;font-weight:800;color:#2ee5a4}.fear-greed-gauge:after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;border-radius:99px;background:linear-gradient(90deg,#ff405b 0%,#ff9f32 28%,#ffe14a 48%,#26d98b 100%);box-shadow:0 0 8px rgba(38,217,139,.18)}.fear-greed-gauge:before{content:"";position:absolute;left:calc(var(--sentiment-progress, 0%) - 5px);bottom:-4px;width:10px;height:10px;border-radius:50%;background:#26d98b;box-shadow:0 0 8px #26d98b;z-index:2}.fear-greed-scale{display:flex;justify-content:space-between;color:#9db1c5;font-size:11px;margin-top:0}.fear-greed-line{height:1px;background:#20384e;margin:18px 0 0}.fear-greed-row{display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid #20384e;color:#9db1c5;font-size:11px}.fear-greed-row strong{color:#eef5ff}.fear-greed-info{margin-top:16px;padding:11px 12px;border:1px solid #24445f;border-radius:14px;color:#8fa8c0;font-size:10px;line-height:1.55;background:#0a1726}.fear-greed-info span{color:#5fb4ff;margin-right:7px}
      `}</style>
      <div className="market-search-wrap">
        <div className="market-search-box">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search markets" aria-label="Search markets" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
        </div>
        <div className="market-search-results">
          {markets.length === 0 ? <div className="market-search-empty">No markets found</div> : markets.map((symbol) => {
            const pair = displayPair(symbol);
            return <button key={symbol} type="button" className={pair === selectedPair ? "selected" : ""} onClick={() => onSelect(pair)}><span className="market-coin-icon" aria-hidden="true"><CoinIcon symbol={symbol.replace("USDT", "")} size={30} /></span><span className="market-coin-name">{pair}</span></button>;
          })}
        </div>
      </div>
      <section className="fear-greed-card" aria-label="Daily Fear and Greed Index">
        <div className="fear-greed-head"><div><div className="fear-greed-kicker">MARKET SENTIMENT</div><h2 className="fear-greed-title">Fear &amp; Greed Index</h2></div><span className="fear-greed-badge">Daily</span></div>
        <div className="fear-greed-gauge" style={{"--sentiment-progress": `${value}%`} as React.CSSProperties}><div className="fear-greed-arc"/><div className="fear-greed-needle" style={{"--needle": `${needleRotation}deg`} as React.CSSProperties}/><div className="fear-greed-score">{sentiment ? value : "—"}</div><div className="fear-greed-state">{sentiment ? sentimentLabel(value) : sentimentError ? "UNAVAILABLE" : "LOADING"}</div></div>
        <div className="fear-greed-scale"><span>Fear</span><span>Greed</span></div>
        <div className="fear-greed-line"/>
        <div className="fear-greed-row"><span>Yesterday</span><strong>{formatChange(yesterdayChange)}</strong></div>
        <div className="fear-greed-row"><span>7d Change</span><strong>{formatChange(weekChange)}</strong></div>
        <div className="fear-greed-row"><span>Last Updated</span><strong>{updated}</strong></div>
        <div className="fear-greed-info"><span>ⓘ</span>Live data from the daily Crypto Fear &amp; Greed Index. Higher values indicate more greed; lower values indicate fear.</div>
      </section>
    </>
  );
}
