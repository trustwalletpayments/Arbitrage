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
    <div className="market-search-wrap" style={{ boxSizing: "border-box", minWidth: 0 }}>
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
                  <CoinIcon symbol={symbol.replace("USDT", "")} size={28} />
                </span>
                <span className="market-coin-name">{pair}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
