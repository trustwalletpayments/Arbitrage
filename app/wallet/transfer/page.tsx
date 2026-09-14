"use client";

import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, CheckCircle2, Info, WalletCards } from "lucide-react";
import { useState } from "react";
import MobileNav from "../../components/MobileNav";
import "../wallet.css";
import "./transfer.css";

export default function TransferPage() {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"funding-to-trading" | "trading-to-funding">("funding-to-trading");
  const [message, setMessage] = useState("");

  const isFundingToTrading = direction === "funding-to-trading";
  const fromWallet = isFundingToTrading ? "Funding Wallet" : "Trading Balance";
  const toWallet = isFundingToTrading ? "Trading Balance" : "Funding Wallet";
  const fromDescription = isFundingToTrading ? "Available for deposits and withdrawals" : "Shared Spot and Futures balance";
  const toDescription = isFundingToTrading ? "Shared balance for Spot and Futures" : "Available for deposits and withdrawals";

  function swapDirection() {
    setDirection((current) => current === "funding-to-trading" ? "trading-to-funding" : "funding-to-trading");
    setMessage("");
  }

  function handleTransfer() {
    const value = Number(amount);
    if (!value || value <= 0) {
      setMessage("Enter a valid amount to continue.");
      return;
    }
    setMessage("Transfer request prepared. Your available balance will be checked before confirmation.");
  }

  return (
    <main className="wallet-page">
      <header className="wallet-header">
        <Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link>
        <Link href="/wallet" className="history-link"><ArrowLeft size={18} /> Back to Funding</Link>
      </header>

      <div className="wallet-content">
        <div className="wallet-heading">
          <div>
            <span className="wallet-kicker">MOVE FUNDS</span>
            <h1>Transfer</h1>
            <p>Move funds between your Funding Wallet and your shared Trading Balance.</p>
          </div>
        </div>

        <section className="transfer-layout">
          <div className="wallet-panel transfer-main-card">
            <div className="transfer-card-heading">
              <div>
                <span className="wallet-kicker">INTERNAL TRANSFER</span>
                <h2>{fromWallet} to {toWallet}</h2>
                <p>Your Trading Balance is shared by both Spot and Futures trading. You do not need separate Spot or Futures wallets.</p>
              </div>
              <div className="transfer-icon"><ArrowLeftRight size={24} /></div>
            </div>

            <div className="transfer-route">
              <div className="transfer-wallet-box">
                <span className="transfer-label">From</span>
                <div className="transfer-wallet-name"><WalletCards size={20} /> {fromWallet}</div>
                <small>{fromDescription}</small>
              </div>
              <button className="transfer-arrow" type="button" onClick={swapDirection} aria-label="Reverse transfer direction" title="Reverse transfer direction"><ArrowLeftRight size={20} /></button>
              <div className="transfer-wallet-box">
                <span className="transfer-label">To</span>
                <div className="transfer-wallet-name"><WalletCards size={20} /> {toWallet}</div>
                <small>{toDescription}</small>
              </div>
            </div>

            <label className="transfer-field-label" htmlFor="transfer-asset">Asset</label>
            <div className="transfer-input-wrap transfer-static-field"><span className="transfer-asset-name">USDT</span><span className="transfer-asset-note">Available asset</span></div>

            <div className="transfer-amount-heading">
              <label className="transfer-field-label" htmlFor="transfer-amount">Amount</label>
              <button type="button" className="transfer-max-button" onClick={() => setAmount("0.00")}>Max</button>
            </div>
            <div className="transfer-input-wrap">
              <input id="transfer-amount" type="number" min="0" step="any" value={amount} onChange={(event) => { setAmount(event.target.value); setMessage(""); }} placeholder="Enter amount" />
              <span>USDT</span>
            </div>
            <div className="transfer-available">Available balance <strong>0.00 USDT</strong></div>

            <div className="transfer-summary">
              <div className="transfer-summary-title">Transfer summary</div>
              <div><span>From</span><strong>{fromWallet}</strong></div>
              <div><span>To</span><strong>{toWallet}</strong></div>
              <div><span>Asset</span><strong>USDT</strong></div>
              <div><span>Transfer fee</span><strong>0.00 USDT</strong></div>
              <div className="transfer-summary-total"><span>You will receive</span><strong>{amount || "0.00"} USDT</strong></div>
            </div>

            <button className="primary-action transfer-submit" type="button" onClick={handleTransfer}><ArrowLeftRight size={18} /> Transfer funds</button>
            {message && <div className="transfer-message"><CheckCircle2 size={17} /> {message}</div>}
          </div>

          <aside className="transfer-info-card">
            <div className="transfer-info-icon"><Info size={20} /></div>
            <h3>How your balances work</h3>
            <div className="transfer-info-row"><span>Funding Wallet</span><strong>Deposit &amp; withdraw</strong></div>
            <div className="transfer-info-row"><span>Trading Balance</span><strong>Spot + Futures</strong></div>
            <div className="transfer-info-row"><span>Wallet structure</span><strong>One shared balance</strong></div>
            <div className="transfer-info-row"><span>Transfer time</span><strong>Usually instant</strong></div>
            <p>There are no separate Spot and Futures wallets. Your Trading Balance is shared across both markets, and funds can be returned to Funding whenever needed.</p>
          </aside>
        </section>

        <div className="wallet-notice"><Info size={19} /><div><strong>Internal transfers move funds between your account sections</strong><span>They do not create a new coin or require a blockchain transaction.</span></div></div>
      </div>
      <MobileNav />
    </main>
  );
}
