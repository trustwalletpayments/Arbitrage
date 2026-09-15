"use client";

import { useEffect, useMemo, useState } from "react";
import "./spot-data.css";

type Props = { symbol: string };
type Depth = { bids: [string, string][]; asks: [string, string][] };
type Trade = {
  id?: number;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
};

function num(value: string | number) {
  return Number(value || 0);
}

function price(value: number) {
  return value
    ? value.toLocaleString(undefined, {
        maximumFractionDigits: value < 1 ? 8 : 2,
      })
    : "—";
}

function amount(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function cumulative(rows: [string, string][], index: number) {
  return rows
    .slice(0, index + 1)
    .reduce((sum, row) => sum + num(row[1]), 0);
}

export default function SpotMarketData({ symbol }: Props) {
  const [depth, setDepth] = useState<Depth>({ bids: [], asks: [] });
  const [ticker, setTicker] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(0);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [depthResponse, tickerResponse, tradesResponse] = await Promise.all([
          fetch(`/api/market/spot?kind=depth&symbol=${symbol}`, { cache: "no-store" }),
          fetch(`/api/market/spot?kind=ticker&symbol=${symbol}`, { cache: "no-store" }),
          fetch(`/api/market/spot?kind=trades&symbol=${symbol}`, { cache: "no-store" }),
        ]);

        const [depthData, tickerData, tradesData] = await Promise.all([
          depthResponse.json(),
          tickerResponse.json(),
          tradesResponse.json(),
        ]);

        if (!alive) return;
        if (!depthResponse.ok || !tickerResponse.ok || !tradesResponse.ok) {
          throw new Error("Market data unavailable");
        }

        setDepth(depthData);
        setTicker(tickerData);
        setTrades(Array.isArray(tradesData) ? tradesData : []);
        setError("");
        setLoading(false);
        setUpdatedAt(Date.now());
      } catch {
        if (alive) {
          setError("Live market data is temporarily unavailable.");
          setLoading(false);
        }
      }
    }

    load();
    const timer = window.setInterval(load, 3000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [symbol]);

  const bids = depth.bids.slice(0, 8);
  const asks = depth.asks.slice(0, 8);
  const change = num(ticker?.priceChangePercent);
  const bestBid = num(bids[0]?.[0]);
  const bestAsk = num(asks[0]?.[0]);
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
  const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;
  const maxDepth = Math.max(
    ...bids.map((row, index) => cumulative(bids, index)),
    ...asks.map((row, index) => cumulative(asks, index)),
    1,
  );

  const statItems = useMemo(
    () => [
      {
        label: "24H CHANGE",
        value: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
        tone: change < 0 ? "negative" : "positive",
      },
      { label: "24H HIGH", value: price(num(ticker?.highPrice)) },
      { label: "24H LOW", value: price(num(ticker?.lowPrice)) },
      {
        label: "24H VOLUME",
        value: `${amount(num(ticker?.quoteVolume))} USDT`,
      },
      { label: "BEST BID", value: price(bestBid), tone: "positive" },
      { label: "BEST ASK", value: price(bestAsk), tone: "negative" },
    ],
    [change, ticker, bestBid, bestAsk],
  );

  return (
    <div className="spot-data-stack">
      <div className="spot-stat-grid">
        {statItems.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong className={item.tone || ""}>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="spot-market-panels">
        <section className="spot-market-card">
          <div className="spot-card-heading">
            <div>
              <span>MARKET DEPTH</span>
              <h3>Order book</h3>
            </div>
            <b>
              <i /> LIVE
            </b>
          </div>

          {error ? (
            <p className="spot-empty">{error}</p>
          ) : loading ? (
            <div className="spot-loading">Loading order book…</div>
          ) : (
            <div className="spot-book">
              <div className="spot-book-head">
                <span>Price (USDT)</span>
                <span>Amount</span>
              </div>

              <div className="spot-asks">
                {asks
                  .slice()
                  .reverse()
                  .map((row, index) => {
                    const width = Math.min(
                      100,
                      (cumulative(asks, asks.length - 1 - index) / maxDepth) * 100,
                    );
                    return (
                      <div className="spot-depth-row" key={`a${index}`}>
                        <em className="depth-bar ask" style={{ width: `${width}%` }} />
                        <span className="negative">{price(num(row[0]))}</span>
                        <span>{amount(num(row[1]))}</span>
                      </div>
                    );
                  })}
              </div>

              <div className="spot-mid-price">
                <strong>{price(num(ticker?.lastPrice))}</strong>
                <small>
                  Spread {price(spread)} · {spreadPercent.toFixed(3)}%
                </small>
              </div>

              <div className="spot-bids">
                {bids.map((row, index) => {
                  const width = Math.min(
                    100,
                    (cumulative(bids, index) / maxDepth) * 100,
                  );
                  return (
                    <div className="spot-depth-row" key={`b${index}`}>
                      <em className="depth-bar bid" style={{ width: `${width}%` }} />
                      <span className="positive">{price(num(row[0]))}</span>
                      <span>{amount(num(row[1]))}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="spot-market-card">
          <div className="spot-card-heading">
            <div>
              <span>MARKET ACTIVITY</span>
              <h3>Recent trades</h3>
            </div>
            <b>
              <i /> LIVE
            </b>
          </div>

          {error ? (
            <p className="spot-empty">{error}</p>
          ) : loading ? (
            <div className="spot-loading">Loading recent trades…</div>
          ) : (
            <div className="spot-book">
              <div className="spot-book-head">
                <span>Price (USDT)</span>
                <span>Amount</span>
                <span>Time</span>
              </div>

              {trades.slice(0, 12).map((trade, index) => (
                <div className="spot-trade-row" key={trade.id || index}>
                  <span className={trade.isBuyerMaker ? "negative" : "positive"}>
                    {price(num(trade.price))}
                  </span>
                  <span>{amount(num(trade.qty))}</span>
                  <small>
                    {new Date(num(trade.time)).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </small>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="spot-data-footer">
        <span>
          <i /> Live market data
        </span>
        <span>
          {updatedAt
            ? `Updated ${new Date(updatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}`
            : "Connecting…"}
        </span>
      </div>
    </div>
  );
}
