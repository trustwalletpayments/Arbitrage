"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpFromLine } from "lucide-react";
import MobileNav from "../../components/MobileNav";
import "../wallet.css";

export default function WithdrawPage() {
  return (
    <main className="wallet-page">
      <header className="wallet-header">
        <Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link>
        <Link href="/wallet" className="history-link"><ArrowLeft size={18} /> Back to Wallet</Link>
      </header>
      <div className="wallet-content">
        <div className="wallet-heading"><div><span className="wallet-kicker">MOVE FUNDS OUT</span><h1>Withdraw</h1><p>Withdraw assets to an external wallet.</p></div></div>
        <section className="wallet-panel" style={{padding:28}}>
          <div className="panel-top" style={{padding:0, marginBottom:24}}><div><span className="wallet-kicker">WITHDRAWAL FORM</span><h2>USDT withdrawal</h2></div></div>
          <label style={{display:"block",color:"#91a4ba",fontSize:13,marginBottom:8}}>Network</label>
          <select style={{width:"100%",padding:14,borderRadius:10,border:"1px solid #243b55",background:"#0e1b2a",color:"#e8f1fb",marginBottom:18}}><option>Choose network</option><option>BNB Smart Chain (BEP-20)</option><option>Ethereum (ERC-20)</option></select>
          <label style={{display:"block",color:"#91a4ba",fontSize:13,marginBottom:8}}>Recipient address</label>
          <input placeholder="Enter wallet address" style={{width:"100%",boxSizing:"border-box",padding:14,borderRadius:10,border:"1px solid #243b55",background:"#0e1b2a",color:"#e8f1fb",marginBottom:18}} />
          <label style={{display:"block",color:"#91a4ba",fontSize:13,marginBottom:8}}>Amount</label>
          <input placeholder="0.00 USDT" type="number" style={{width:"100%",boxSizing:"border-box",padding:14,borderRadius:10,border:"1px solid #243b55",background:"#0e1b2a",color:"#e8f1fb"}} />
          <button className="primary-action" type="button" style={{border:0,marginTop:24,cursor:"pointer"}}><ArrowUpFromLine size={18}/> Withdraw USDT</button>
          <p style={{color:"#718399",fontSize:13,marginTop:20}}>Withdrawals are currently in preview mode. No real funds are sent.</p>
        </section>
      </div>
      <MobileNav />
    </main>
  );
}
