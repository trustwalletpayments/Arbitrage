"use client";

import { useEffect, useMemo, useState } from "react";
import CoinIcon from "./CoinIcon";
import { MARKET_SYMBOLS, displayPair } from "../../lib/market-data";

type Props = { selectedPair: string; onSelect: (pair: string) => void };

function FearGreedCard() {
  const [value, setValue] = useState<number | null>(null);
  const [label, setLabel] = useState("Loading…");
  const [updated, setUpdated] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.alternative.me/fng/?limit=1", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        const item = data?.data?.[0];
        const score = Number(item?.value);
        if (!Number.isFinite(score)) throw new Error("Invalid sentiment data");
        setValue(score);
        setLabel(item?.value_classification || "Neutral");
        if (item?.timestamp) setUpdated(new Date(Number(item.timestamp) * 1000).toLocaleDateString());
      })
      .catch(() => {
        if (!cancelled) {
          setValue(null);
          setLabel("Unavailable");
        }
      });
    return () => { cancelled = true; };
  }, []);

  const score = value ?? 0;
  const angle = -90 + (score / 100) * 180;

  return (
    <section className="fear-greed-card" aria-label="Daily Fear and Greed Index">
      <div className="fear-greed-head">
        <div>
          <div className="fear-greed-label">MARKET SENTIMENT</div>
          <h2>Fear &amp; Greed Index</h2>
        </div>
        <span>Daily</span>
      </div>
      <div className="fear-greed-gauge">
        <div className="fear-greed-arc" />
        <div className="fear-greed-needle" style={{ transform: `rotate(${angle}deg)` }} />
        <div className="fear-greed-score">{value ?? "—"}</div>
        <strong>{label.toUpperCase()}</strong>
      </div>
      <div className="fear-greed-scale"><span>Fear</span><span>Greed</span></div>
      <div className="fear-greed-line"><span>Yesterday</span><b>—</b></div>
      <div className="fear-greed-line"><span>7d Change</span><b>—</b></div>
      <div className="fear-greed-line"><span>Last Updated</span><b>{updated || "—"}</b></div>
      <div className="fear-greed-note">ⓘ Higher values indicate more greed in the market, lower values indicate fear.</div>
    </section>
  );
}

export default function MarketSearch({ selectedPair, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [symbols, setSymbols] = useState<string[]>([...MARKET_SYMBOLS]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/testnet/markets", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data?.symbols) && data.symbols.length > 0) {
          setSymbols(data.symbols);
        }
      })
      .catch(() => {
        // Keep the built-in fallback markets if the public exchange API is unavailable.
      });
    return () => { cancelled = true; };
  }, []);

  const markets = useMemo(() => {
    const normalized = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return symbols.filter((symbol) => !normalized || symbol.includes(normalized));
  }, [query, symbols]);

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
        .fear-greed-card{width:240px;min-height:520px;padding:22px 16px;box-sizing:border-box;border:1px solid #203d59;border-radius:16px;background:linear-gradient(145deg,#0d1b2b,#091321);color:#e8f1fb;overflow:hidden;}
        .fear-greed-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
        .fear-greed-label{font-size:10px;letter-spacing:.1em;color:#7890a8;}
        .fear-greed-head h2{margin:7px 0 0;font-size:19px;line-height:1.2;white-space:nowrap;}
        .fear-greed-head>span{padding:6px 9px;border:1px solid #23435e;border-radius:999px;color:#9bb1c8;font-size:11px;}
        .fear-greed-gauge{position:relative;width:190px;height:145px;margin:32px auto 0;text-align:center;}
        .fear-greed-arc{position:absolute;left:5px;top:0;width:180px;height:90px;border-radius:180px 180px 0 0;border:14px solid transparent;border-bottom:0;background:linear-gradient(90deg,#fb4b55,#ffb52e,#f6df45,#34d399) border-box;mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0);mask-composite:exclude;}
        .fear-greed-needle{position:absolute;left:94px;top:80px;width:3px;height:55px;background:#dcecff;transform-origin:50% 0;border-radius:3px;box-shadow:0 0 8px #34d399;}
        .fear-greed-score{position:absolute;top:52px;left:0;right:0;font-size:34px;font-weight:800;}
        .fear-greed-gauge strong{position:absolute;top:101px;left:0;right:0;color:#34d399;font-size:13px;letter-spacing:.04em;}
        .fear-greed-scale{display:flex;justify-content:space-between;color:#9bb1c8;font-size:12px;margin:0 0 20px;}
        .fear-greed-line{display:flex;justify-content:space-between;gap:8px;padding:11px 0;border-top:1px solid #203247;color:#91a5bb;font-size:12px;}
        .fear-greed-line b{color:#e8f1fb;font-weight:600;text-align:right;}
        .fear-greed-note{margin-top:18px;padding:12px;border:1px solid #23435e;border-radius:10px;background:#0a1726;color:#91a9c1;font-size:11px;line-height:1.6;}
        @media(min-width:1100px){.futures-wrap>.fear-greed-card{grid-column:1!important;grid-row:6!important;align-self:start!important;margin:0!important;}}
        @media(max-width:1099px){.fear-greed-card{width:100%;min-height:0;}}
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
      <FearGreedCard />
    </>
  );
}
