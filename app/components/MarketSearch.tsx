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
    <div
      className="market-search-wrap"
      style={{
        boxSizing: "border-box",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
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
      <div
        className="market-search-results"
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "thin",
        }}
      >
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flex: "0 0 auto",
                  minWidth: 0,
                  minHeight: 54,
                  padding: "11px 14px",
                  borderRadius: 12,
                  textAlign: "left",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 34,
                    minWidth: 34,
                    height: 34,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CoinIcon symbol={symbol.replace("USDT", "")} size={26} />
                </span>
                <span
                  style={{
                    minWidth: 0,
                    flex: "1 1 auto",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {pair}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
