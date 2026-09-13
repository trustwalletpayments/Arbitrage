"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpFromLine } from "lucide-react";
import "../wallet.css";

export default function SendPage() {
  return (
    <main className="wallet-page">
      <div className="wallet-content" style={{ maxWidth: 760, margin: "0 auto", paddingTop: 48 }}>
        <Link href="/dashboard" className="history-link"><ArrowLeft size={18} /> Back to dashboard</Link>
        <section className="wallet-panel" style={{ marginTop: 28 }}>
          <div className="panel-top"><div><span className="wallet-kicker">SEND FUNDS</span><h2>Send crypto</h2><p>Send assets to another wallet address.</p></div></div>
          <div style={{ display: "grid", gap: 16, padding: "24px 0" }}>
            <label>Asset<select><option>USDT</option><option>BTC</option><option>ETH</option></select></label>
            <label>Recipient address<input placeholder="Enter wallet address" /></label>
            <label>Amount<input type="number" min="0" placeholder="0.00" /></label>
            <button className="primary-action" type="button"><ArrowUpFromLine size={18} /> Continue</button>
          </div>
        </section>
      </div>
    </main>
  );
}
