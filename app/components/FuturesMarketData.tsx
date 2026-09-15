"use client";

import { useEffect, useState } from "react";
import { binanceSymbol } from "../../lib/market-data";
import { closeTestnetPosition, getTestnetPositions } from "../../lib/testnet-store";
import type { StoredPosition } from "../../lib/testnet-store";
import { getTestnetBalances, setTestnetBalances, recordFuturesSettlement } from "../../lib/testnet-wallet";

type Book = { bids: [string, string][]; asks: [string, string][] };
type Ticker = { priceChangePercent?: string; highPrice?: string; lowPrice?: string; quoteVolume?: string; lastPrice?: string };
type Premium = { lastFundingRate?: string; markPrice?: string; indexPrice?: string };

const formatNumber = (value?: string | number, digits = 2) => {
  if (value === undefined || value === null || value === "") return "—";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
};

export default function FuturesMarketData({ pair }: { pair: string }) {
  const [book, setBook] = useState<Book>({ bids: [], asks: [] });
  const [trades, setTrades] = useState<any[]>([]);
  const [ticker, setTicker] = useState<Ticker>({});
  const [premium, setPremium] = useState<Premium>({});
  const [positions, setPositions] = useState<StoredPosition[]>([]);
  const [settling, setSettling] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let stopped = false;
    const symbol = binanceSymbol(pair);
    const load = async () => {
      try {
        const response = await fetch(`/api/testnet/futures?symbol=${encodeURIComponent(symbol)}&market=1&t=${Date.now()}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "Market data unavailable");
        if (!stopped) {
          setBook({ bids: Array.isArray(data.depth?.bids) ? data.depth.bids : [], asks: Array.isArray(data.depth?.asks) ? data.depth.asks : [] });
          setTrades(Array.isArray(data.recentTrades) ? data.recentTrades : []);
          setTicker(data.dailyTicker || {});
          setPremium(data.funding || {});
          setError("");
          setLoading(false);
        }
      } catch (e) {
        if (!stopped) { setError(e instanceof Error ? e.message : "Unable to load market data"); setLoading(false); }
      }
    };
    setLoading(true);
    load();
    const timer = window.setInterval(load, 3000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [pair]);

  useEffect(() => {
    const refresh = () => setPositions(getTestnetPositions().filter((p) => p.symbol === pair && p.status === "OPEN"));
    refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, [pair]);

  const closeAtMarket = (id: string) => {
    if (settling) return;
    setSettling(id); setNotice("");
    try {
      const current = getTestnetPositions().find((p) => p.id === id);
      const closePrice = Number(premium.markPrice || ticker.lastPrice);
      if (!current || current.status !== "OPEN") throw new Error("Position is already closed");
      if (!Number.isFinite(closePrice) || closePrice <= 0) throw new Error("Live market price is unavailable");
      const pnl = current.side === "LONG" ? (closePrice - current.entryPrice) * current.quantity : (current.entryPrice - closePrice) * current.quantity;
      const returned = Math.max(0, current.margin + pnl);
      const balances = getTestnetBalances();
      const funds = balances.find((x) => x.asset === "USDT");
      if (!funds) throw new Error("USDT wallet is unavailable");
      funds.futures += returned;
      setTestnetBalances(balances);
      closeTestnetPosition(id, closePrice, "CLOSED");
      recordFuturesSettlement({ symbol: current.symbol, side: current.side, status: "CLOSED", margin: returned, realizedPnl: pnl });
      setPositions(getTestnetPositions().filter((p) => p.symbol === pair && p.status === "OPEN"));
      setNotice(`Position closed at ${closePrice.toFixed(4)} · ${pnl >= 0 ? "Profit" : "Loss"} ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USDT`);
    } catch (e) { setNotice(e instanceof Error ? e.message : "Unable to close position"); }
    finally { setSettling(null); }
  };

  const change = Number(ticker.priceChangePercent || 0);
  const spread = book.asks[0] && book.bids[0] ? (Number(book.asks[0][0]) - Number(book.bids[0][0])).toFixed(2) : "—";

  return <>
    <style>{`
      .futures-stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin:20px 0}.futures-stat{min-width:0;min-height:82px;padding:15px 16px;border:1px solid #1d344c;border-radius:14px;background:linear-gradient(145deg,#0d1b2b,#091321);display:flex;flex-direction:column;justify-content:space-between}.futures-stat-label{font-size:10px;line-height:1.25;letter-spacing:.08em;color:#7890a8;text-transform:uppercase}.futures-stat-value{margin-top:10px;font-size:15px;font-weight:700;color:#e5effb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.positive{color:#36d399!important}.negative{color:#fb7185!important}.futures-data-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:stretch}.market-data-panel,.settlement-panel{min-width:0;padding:22px!important;border:1px solid #1d344c!important;border-radius:16px!important;background:linear-gradient(145deg,#0d1b2b,#091321)!important}.market-data-panel{min-height:390px}.market-data-panel h2,.settlement-panel h2{margin:6px 0 0;font-size:22px}.section-heading{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px}.section-heading .label{font-size:10px;letter-spacing:.1em;color:#7890a8}.section-live{padding:5px 9px;border:1px solid #23435e;border-radius:999px;color:#7e9ab5;font-size:11px}.book-head,.trades-head,.book-row,.trade-line{display:grid;align-items:center;gap:12px;font-size:12px}.book-head,.book-row{grid-template-columns:1fr 1fr}.trades-head,.trade-line{grid-template-columns:1fr 1fr 72px}.book-head,.trades-head{padding:10px 0;color:#7890a8;border-bottom:1px solid #1c3044}.book-row,.trade-line{padding:8px 0;color:#b8c8d8;border-bottom:1px solid #14283b}.book-row span:last-child,.trade-line span:nth-child(2),.trade-line span:last-child{text-align:right}.book-side.asks span:first-child{color:#fb7185}.book-side.bids span:first-child{color:#36d399}.book-mid{margin:8px 0;padding:9px;text-align:center;border:1px dashed #2b4761;border-radius:9px;color:#8198af;font-size:11px;background:#0a1726}.empty-state{display:flex;align-items:center;justify-content:center;min-height:230px;color:#6f8499;font-size:12px;text-align:center}.trade-line.up span:first-child{color:#36d399}.trade-line.down span:first-child{color:#fb7185}.trade-line span:last-child{font-size:11px;color:#7890a8}.scroll-table{min-height:280px}.settlement-panel{margin-top:16px}.settlement-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 0;border-bottom:1px solid #14263a}.settlement-meta{display:flex;flex-direction:column;gap:5px;min-width:0}.settlement-meta strong{font-size:13px;color:#e5effb}.settlement-button{border:1px solid #31506d;background:#10263a;color:#dbeafe;border-radius:9px;padding:9px 13px;cursor:pointer;font:inherit;white-space:nowrap}.settlement-button:hover{background:#173b59}.settlement-button:disabled{opacity:.55;cursor:not-allowed}.settlement-notice{margin-top:12px;padding:10px 12px;border:1px solid #23435e;border-radius:9px;color:#9ec5e8;font-size:12px;background:#0a1726}.market-error{margin-bottom:12px;color:#fb7185;font-size:12px}@media(max-width:1100px){.futures-stats{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:760px){.futures-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:14px 0}.futures-stat{min-height:74px;padding:12px}.futures-stat-value{font-size:14px}.futures-data-grid{grid-template-columns:1fr;gap:14px}.market-data-panel,.settlement-panel{min-height:0;padding:18px!important;border-radius:13px!important}.market-data-panel h2,.settlement-panel h2{font-size:20px}.settlement-row{align-items:flex-start;flex-direction:column}.settlement-button{width:100%}}
    `}</style>
    <div className="futures-stats">
      <div className="futures-stat"><div className="futures-stat-label">24h Change</div><div className={`futures-stat-value ${change >= 0 ? "positive" : "negative"}`}>{ticker.priceChangePercent ? `${change.toFixed(2)}%` : "—"}</div></div>
      <div className="futures-stat"><div className="futures-stat-label">24h High</div><div className="futures-stat-value">{formatNumber(ticker.highPrice)}</div></div>
      <div className="futures-stat"><div className="futures-stat-label">24h Low</div><div className="futures-stat-value">{formatNumber(ticker.lowPrice)}</div></div>
      <div className="futures-stat"><div className="futures-stat-label">24h Volume</div><div className="futures-stat-value">{formatNumber(ticker.quoteVolume, 0)}</div></div>
      <div className="futures-stat"><div className="futures-stat-label">Funding Rate</div><div className="futures-stat-value">{premium.lastFundingRate ? `${(Number(premium.lastFundingRate) * 100).toFixed(4)}%` : "—"}</div></div>
      <div className="futures-stat"><div className="futures-stat-label">Mark / Index</div><div className="futures-stat-value">{premium.markPrice && premium.indexPrice ? `${formatNumber(premium.markPrice)} / ${formatNumber(premium.indexPrice)}` : "—"}</div></div>
    </div>
    <div className="futures-data-grid">
      <section className="panel market-data-panel"><div className="section-heading"><div><div className="label">MARKET DEPTH</div><h2>Order book</h2></div><span className="section-live">LIVE</span></div>{error&&<div className="market-error">{error}</div>}<div className="scroll-table"><div className="book-head"><span>Price (USDT)</span><span>Amount</span></div>{book.asks.length||book.bids.length?<><div className="book-side asks">{book.asks.slice(0,6).reverse().map((row,i)=><div className="book-row" key={`ask-${i}`}><span>{formatNumber(row[0])}</span><span>{formatNumber(row[1],4)}</span></div>)}</div><div className="book-mid">Spread {spread}</div><div className="book-side bids">{book.bids.slice(0,6).map((row,i)=><div className="book-row" key={`bid-${i}`}><span>{formatNumber(row[0])}</span><span>{formatNumber(row[1],4)}</span></div>)}</div></>:<div className="empty-state">{loading?"Order book is loading…":"Order book unavailable"}</div>}</div></section>
      <section className="panel market-data-panel"><div className="section-heading"><div><div className="label">RECENT ACTIVITY</div><h2>Recent trades</h2></div><span className="section-live">LIVE</span></div><div className="scroll-table"><div className="trades-head"><span>Price</span><span>Quantity</span><span>Time</span></div>{trades.length?trades.slice(0,10).map((trade,i)=><div className={`trade-line ${trade.isBuyerMaker?"down":"up"}`} key={i}><span>{formatNumber(trade.p)}</span><span>{formatNumber(trade.q,4)}</span><span>{new Date(trade.T||Date.now()).toLocaleTimeString()}</span></div>):<div className="empty-state">{loading?"Recent trades are loading…":"Recent trades unavailable"}</div>}</div></section>
    </div>
    <section className="panel settlement-panel"><div className="section-heading"><div><div className="label">TESTNET POSITIONS</div><h2>Position settlement</h2></div><span className="section-live">MARKET CLOSE</span></div>{positions.length===0?<div className="muted tiny">No open {pair} positions.</div>:positions.map(position=><div className="settlement-row" key={position.id}><div className="settlement-meta"><strong>{position.side} · {position.quantity} {position.symbol.replace("USDT","")}</strong><span className="muted tiny">Entry {formatNumber(position.entryPrice)} · Margin {position.margin.toFixed(2)} USDT · {position.leverage}x</span></div><button className="settlement-button" disabled={settling===position.id} onClick={()=>closeAtMarket(position.id)}>{settling===position.id?"Closing…":"Close at market"}</button></div>)}{notice&&<div className="settlement-notice">{notice}</div>}</section>
  </>;
}
