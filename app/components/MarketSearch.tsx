"use client";

import { useEffect, useMemo, useState } from "react";
import CoinIcon from "./CoinIcon";
import { MARKET_SYMBOLS, displayPair } from "../../lib/market-data";

type Props = { selectedPair: string; onSelect: (pair: string) => void };

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
    return () => {
      cancelled = true;
    };
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
      `}</style>
      <div className="market-search-wrap">
        <div className="market-search-box">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search markets"
            aria-label="Search markets"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              ×
            </button>
          )}
        </div>
        <div className="market-search-results">
          {markets.length === 0 ? (
            <div className="market-search-empty">No markets found</div>
          ) : (
            markets.map((symbol) => {
              const pair = displayPair(symbol);
              return (
                <button
                  key={symbol}
                  type="button"
                  className={pair === selectedPair ? "selected" : ""}
                  onClick={() => onSelect(pair)}
                >
                  <span className="market-coin-icon" aria-hidden="true">
                    <CoinIcon symbol={symbol.replace("USDT", "")} size={30} />
                  </span>
                  <span className="market-coin-name">{pair}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
