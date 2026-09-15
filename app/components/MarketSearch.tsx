"use client";

import { useMemo, useState } from "react";
import CoinIcon from "./CoinIcon";
import { MARKET_SYMBOLS, displayPair } from "../../lib/market-data";

type Props = { selectedPair: string; onSelect: (pair: string) => void };

export default function MarketSearch({ selectedPair, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const markets = useMemo(() => {
    const normalized = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return MARKET_SYMBOLS.filter((symbol) => !normalized || symbol.includes(normalized));
  }, [query]);

  return (
    <div className="market-search-wrap">
      <div className="market-search-box">
        <span aria-hidden="true">⌕</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search markets"
          aria-label="Search markets"
        />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
      </div>
      <div className="market-search-results">
        {markets.length === 0 ? (
          <div className="market-search-empty">No markets found</div>
        ) : (
          markets.slice(0, 30).map((symbol) => {
            const pair = displayPair(symbol);
            return (
              <button key={symbol} type="button" className={pair === selectedPair ? "selected" : ""} onClick={() => onSelect(pair)}>
                <CoinIcon symbol={symbol.replace("USDT", "")} size={20} />
                <span>{pair}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
