"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTestnetOrders, getTestnetPositions } from "../../lib/testnet-store";
import type { StoredOrder, StoredPosition } from "../../lib/testnet-store";

type HistoryTab = "all" | "spot" | "futures";

export default function Orders() {
  const [tab, setTab] = useState<HistoryTab>("all");
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [positions, setPositions] = useState<StoredPosition[]>([]);

  function refresh() {
    setOrders(getTestnetOrders());
    setPositions(getTestnetPositions());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("wallet-balances-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("wallet-balances-updated", refresh);
    };
  }, []);

  const hasActivity = orders.length > 0 || positions.length > 0;

  return (
    <main className="app-shell">
      <header className="appbar"><Link className="brand" href="/">ORBITEX<span>.</span></Link><nav><Link href="/dashboard">Dashboard</Link><Link href="/trade">Spot</Link><Link href="/futures">Futures</Link><Link href="/wallet">Funding</Link><Link className="active" href="/orders">History</Link></nav><Link className="btn" href="/wallet">Funding</Link></header>
      <section className="app-content">
        <div className="page-title"><div><div className="eyebrow">ACCOUNT ACTIVITY</div><h1>History</h1><p className="muted">Review your spot orders, futures positions, and account activity separately.</p></div><button className="btn" onClick={refresh}>Refresh</button></div>
        <div className="panel">
          <div className="tabs static"><button className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>All activity</button><button className={tab === "spot" ? "on" : ""} onClick={() => setTab("spot")}>Spot orders</button><button className={tab === "futures" ? "on" : ""} onClick={() => setTab("futures")}>Futures positions</button></div>
          {tab !== "futures" && <section><h2>Spot orders</h2>{orders.length === 0 ? <div className="empty"><div className="empty-icon">—</div><h2>No spot orders yet</h2><p className="muted">Completed spot orders will appear here.</p><Link className="btn primary" href="/trade">Open spot trading</Link></div> : <div className="market-list">{orders.map((o) => <div className="panel" key={o.id}><div className="trade-head"><div><div className="pair">{o.symbol} · {o.side}</div><div className="muted">{new Date(o.createdAt).toLocaleString()}</div></div><span className="up">{o.status}</span></div><div className="order-info"><span>Type</span><span>{o.type}</span><span>Price</span><span>{o.price.toFixed(2)}</span><span>Quantity</span><span>{o.quantity}</span></div></div>)}</div>}</section>}
          {tab !== "spot" && <section><h2>Futures positions</h2>{positions.length === 0 ? <div className="empty"><div className="empty-icon">—</div><h2>No futures positions yet</h2><p className="muted">Opened and closed futures positions will appear here.</p><Link className="btn primary" href="/futures">Open futures trading</Link></div> : <div className="market-list">{positions.map((p) => <div className="panel" key={p.id}><div className="trade-head"><div><div className="pair">{p.symbol} · {p.side}</div><div className="muted">Entry {p.entryPrice.toFixed(2)} · Mark/close {(p.closePrice ?? p.markPrice).toFixed(2)}</div></div><strong>{p.leverage}x</strong></div><div className="order-info"><span>Quantity</span><span>{p.quantity}</span><span>Margin</span><span>{p.margin.toFixed(2)} USDT</span><span>P&amp;L</span><strong>{(p.status === "OPEN" ? p.unrealizedPnl : p.realizedPnl || 0).toFixed(2)} USDT</strong><span>Status</span><span>{p.status || "OPEN"}</span></div></div>)}</div>}</section>}
          {!hasActivity && <p className="muted tiny">No activity is recorded yet. Activity will appear after a completed order or position.</p>}
        </div>
      </section>
    </main>
  );
}
