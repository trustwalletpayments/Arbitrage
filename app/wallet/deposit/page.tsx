"use client";

import Link from "next/link";
import { ArrowLeft, ArrowDownToLine, Copy, WalletCards } from "lucide-react";
import MobileNav from "../../components/MobileNav";
import "../wallet.css";

export default function DepositPage() {
  return (
    <main className="wallet-page">
      <header className="wallet-header">
        <Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link>
        <Link href="/wallet" className="history-link"><ArrowLeft size={18} /> Back to Wallet</Link>
      </header>
      <div className="wallet-content">
        <div className="wallet-heading"><div><span className="wallet-kicker">FUND YOUR ACCOUNT</span><h1>Deposit</h1><p>Deposit supported assets into your Orbitex wallet.</p></div></div>
        <section className="wallet-panel" style={{padding:28}}>
          <div className="panel-top" style={{padding:0, marginBottom:24}}><div><span className="wallet-kicker">SELECT ASSET</span><h2>Choose a deposit asset</h2></div></div>
          <div className="wallet-notice" style={{marginTop:0}}><WalletCards size={22}/><div><strong>USDT deposit</strong><span>Select your network and copy the deposit address when deposits are enabled.</span></div></div>
          <div className="wallet-actions" style={{marginTop:24}}><button className="primary-action" type="button"><ArrowDownToLine size={18}/> Deposit USDT</button><button className="secondary-action" type="button"><Copy size={18}/> Copy address</button></div>
          <p style={{color:"#718399",fontSize:13,marginTop:24}}>Deposits are currently shown as a preview. Always verify the network before sending funds.</p>
        </section>
      </div>
      <MobileNav />
    </main>
  );
}
