"use client";

import Link from "next/link";
import { ArrowLeft, Copy, ShieldCheck, Send } from "lucide-react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import MobileNav from "../../../components/MobileNav";
import { createSupabaseBrowserClient } from "../../../../lib/supabase-browser";
import "../../wallet.css";
import "../deposit.css";
import "./address.css";

const TREASURY_ADDRESS = "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83";

function DepositAddressContent() {
  const params = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const asset = params.get("asset") || "USDT";
  const assetName = params.get("assetName") || "Tether";
  const network = params.get("network") || "BNB Smart Chain";
  const networkShort = params.get("networkShort") || "BEP-20";
  const networkId = params.get("networkId") || "bsc";
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supported = asset === "USDT" && networkId === "bsc";

  async function copyAddress() {
    try { await navigator.clipboard.writeText(TREASURY_ADDRESS); } catch {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function submitDeposit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    const numericAmount = Number(amount);
    const normalizedHash = txHash.trim().toLowerCase();
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError("Enter a valid deposit amount.");
    if (!/^0x[a-fA-F0-9]{64}$/.test(normalizedHash)) return setError("Enter a valid 0x transaction hash.");

    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setSubmitting(false);
      return setError("Please sign in before submitting a deposit.");
    }

    const response = await fetch("/api/wallet/deposit/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ amount: numericAmount, txHash: normalizedHash }),
    });
    const result = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      setError(result.error || "Deposit verification failed. Please check the transaction details.");
      return;
    }

    setAmount("");
    setTxHash("");
    setMessage(result.status === "confirming"
      ? `Transaction verified. Waiting for confirmations (${result.confirmations || 0}).`
      : "Deposit verified and credited to your Orbitex balance.");
  }

  return <main className="wallet-page"><header className="wallet-header"><Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link><Link href="/wallet/deposit" className="history-link"><ArrowLeft size={18}/> Back to Deposit</Link></header><div className="wallet-content deposit-content"><div className="wallet-heading"><div><span className="wallet-kicker">FUND YOUR ACCOUNT</span><h1>Deposit address</h1><p>Send funds to the treasury address, then submit your transaction hash.</p></div></div><section className="deposit-shell deposit-address-only"><div className="deposit-details withdraw-form mobile-visible"><div className="selected-asset-heading"><div className="deposit-asset-logo"><span>{asset.slice(0, 2)}</span></div><div><span className="wallet-kicker">DEPOSIT ASSET</span><h2>{assetName} <em>{asset}</em></h2></div></div>{supported ? <><div className="deposit-address-step"><div className="deposit-address-title"><span className="wallet-kicker">ORBITEX TREASURY ADDRESS</span><h3>{asset} on {networkShort}</h3><p>Send only <strong>{asset}</strong> using the <strong>{network}</strong> network.</p></div><div className="deposit-address-box"><span>{asset} on {network} ({networkShort}) deposit address</span><strong>{TREASURY_ADDRESS}</strong><button type="button" onClick={copyAddress}><Copy size={17}/> {copied ? "Copied" : "Copy address"}</button></div><div className="deposit-security-note"><ShieldCheck size={18}/><span>Use the exact network and submit the transaction hash below. Deposits are credited only after on-chain verification.</span></div></div><form onSubmit={submitDeposit} className="deposit-submit-form"><div className="deposit-address-title"><span className="wallet-kicker">VERIFY YOUR TRANSFER</span><h3>Submit transaction</h3></div><label>Amount sent<input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00 USDT" /></label><label>Transaction hash<input value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="0x..." autoComplete="off" /></label>{error && <p className="deposit-error">{error}</p>}{message && <p className="deposit-success">{message}</p>}<button className="deposit-submit-button" type="submit" disabled={submitting}><Send size={17}/> {submitting ? "Verifying..." : "Submit deposit"}</button></form></> : <div className="deposit-address-box"><strong>Network not supported</strong><span>Only USDT on BNB Smart Chain (BEP-20) is currently supported.</span></div>}<Link href="/wallet/deposit" className="mobile-back-button" style={{display:"flex",marginTop:14}}><ArrowLeft size={17}/> Choose another asset</Link></div></section></div><MobileNav/></main>;
}

export default function DepositAddressPage() { return <Suspense fallback={<main className="wallet-page" />}><DepositAddressContent /></Suspense>; }
