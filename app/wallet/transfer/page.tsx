"use client";

import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, CheckCircle2, Info, WalletCards } from "lucide-react";
import { useState } from "react";
import MobileNav from "../../components/MobileNav";
import "../wallet.css";

export default function TransferPage() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

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
            <p>Move available funds into your trading balance whenever you are ready to trade.</p>
          </div>
        </div>

        <section className="transfer-layout">
          <div className="wallet-panel transfer-main-card">
            <div className="transfer-card-heading">
              <div>
                <span className="wallet-kicker">INTERNAL TRANSFER</span>
                <h2>Funding to Trading</h2>
                <p>Your funding wallet is the main balance. The same trading balance can be used for both Spot and Futures trading.</p>
              </div>
              <div className="transfer-icon"><ArrowLeftRight size={24} /></div>
            </div>

            <div className="transfer-route">
              <div className="transfer-wallet-box">
                <span className="transfer-label">From</span>
                <div className="transfer-wallet-name"><WalletCards size={20} /> Funding Wallet</div>
                <small>Available balance</small>
              </div>
              <div className="transfer-arrow"><ArrowLeftRight size={20} /></div>
              <div className="transfer-wallet-box">
                <span className="transfer-label">To</span>
                <div className="transfer-wallet-name"><WalletCards size={20} /> Trading Balance</div>
                <small>Used for Spot and Futures</small>
              </div>
            </div>

            <label className="transfer-field-label" htmlFor="transfer-amount">Amount</label>
            <div className="transfer-input-wrap">
              <input id="transfer-amount" type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" />
              <span>USDT</span>
            </div>

            <button className="primary-action transfer-submit" type="button" onClick={handleTransfer}><ArrowLeftRight size={18} /> Transfer funds</button>
            {message && <div className="transfer-message"><CheckCircle2 size={17} /> {message}</div>}
          </div>

          <aside className="transfer-info-card">
            <div className="transfer-info-icon"><Info size={20} /></div>
            <h3>How your balances work</h3>
            <div className="transfer-info-row"><span>Funding Wallet</span><strong>Deposit & withdraw</strong></div>
            <div className="transfer-info-row"><span>Trading Balance</span><strong>Spot + Futures</strong></div>
            <div className="transfer-info-row"><span>Transfer time</span><strong>Usually instant</strong></div>
            <p>You do not need separate wallets to choose a market. Use the trading balance for either Spot or Futures, and return funds to Funding when needed.</p>
          </aside>
        </section>

        <div className="wallet-notice"><Info size={19} /><div><strong>Transfer is for moving funds between account sections</strong><span>It does not create a new coin or change your ownership. Only assets with an actual balance will appear in your wallet.</span></div></div>
      </div>
      <MobileNav />
    </main>
  );
}
