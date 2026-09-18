"use client";

import Link from "next/link";
import { ArrowLeft, Copy, ShieldCheck, Send, Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MobileNav from "../../../components/MobileNav";
import CoinIcon from "../../../components/CoinIcon";
import { createSupabaseBrowserClient } from "../../../../lib/supabase-browser";
import "../../wallet.css";
import "../deposit.css";
import "./address.css";

function DepositAddressContent() {
  const params = useSearchParams();
  const asset = params.get("asset") || "USDT";
  const assetName = params.get("assetName") || "Tether";
  const network = params.get("network") || "BNB Smart Chain";
  const networkShort = params.get("networkShort") || "BEP-20";
  const networkId = params.get("networkId") || "bsc";
  const [address, setAddress] = useState("");
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const verificationSupported = asset === "USDT" && networkId === "bsc";

  useEffect(() => {
    let cancelled = false;
    async function provision() {
      setLoadingAddress(true);
      setError("");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        if (!cancelled) { setLoadingAddress(false); setError("Please sign in before requesting a deposit address."); }
        return;
      }
      const response = await fetch("/api/wallet/provision", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ asset, network: networkId }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (cancelled) return;
      setLoadingAddress(false);
      if (!response.ok || !result.wallet?.deposit_address) {
        setError([result.error, result.details, result.causeCode ? `Code: ${result.causeCode}` : "", result.endpointHost ? `Host: ${result.endpointHost}` : ""].filter(Boolean).join(" "));
        return;
      }
      setAddress(result.wallet.deposit_address);
    }
    provision();
    return () => { cancelled = true; };
  }, [asset, networkId, supabase]);

  async function copyAddress() {
    if (!address) return;
    try { await navigator.clipboard.writeText(address); } catch {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function submitDeposit(event: React.FormEvent) {
    event.preventDefault();
    setError(""); setMessage("");
    const numericAmount = Number(amount);
    const normalizedHash = txHash.trim().toLowerCase();
    if (!verificationSupported) return setError("Automatic verification for this asset/network is not enabled yet.");
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError("Enter a valid deposit amount.");
    if (!/^0x[a-fA-F0-9]{64}$/.test(normalizedHash)) return setError("Enter a valid 0x transaction hash.");
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { setSubmitting(false); return setError("Please sign in before submitting a deposit."); }
    const response = await fetch("/api/wallet/deposit/submit", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ amount: numericAmount, txHash: normalizedHash, asset, network: networkId }),
    });
    const result = await response.json().catch(() => ({}));
    setSubmitting(false);
    if (!response.ok) {
      const missing = Array.isArray(result.missing) && result.missing.length ? ` Missing: ${result.missing.join(", ")}.` : "";
      setError(`${result.error || "Deposit verification failed."}${missing}`); return;
    }
    setAmount(""); setTxHash("");
    setMessage(result.status === "confirming" ? `Transaction verified. Waiting for confirmations (${result.confirmations || 0}).` : "Deposit verified and credited to your Orbitex balance.");
  }

  const qrUrl = address ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(address)}` : "";

  return <main className="wallet-page"><header className="wallet-header"><Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link><Link href="/wallet/deposit" className="history-link"><ArrowLeft size={18}/> Back to Deposit</Link></header><div className="wallet-content deposit-content"><div className="wallet-heading"><div><span className="wallet-kicker">FUND YOUR ACCOUNT</span><h1>Deposit address</h1><p>Your deposit address is generated specifically for this account and network.</p></div></div><section className="deposit-shell deposit-address-only"><div className="deposit-details withdraw-form mobile-visible"><div className="selected-asset-heading"><div className="deposit-asset-logo"><CoinIcon symbol={asset} size={36} /></div><div><span className="wallet-kicker">DEPOSIT ASSET</span><h2>{assetName} <em>{asset}</em></h2></div></div><div className="deposit-address-step"><div className="deposit-address-title"><span className="wallet-kicker">YOUR ORBITEX DEPOSIT ADDRESS</span><h3>{asset} on {networkShort}</h3><p>Send only <strong>{asset}</strong> using the <strong>{network}</strong> network.</p></div>{loadingAddress ? <div className="deposit-address-box"><span>Generating your unique deposit address</span><strong style={{display:"flex",alignItems:"center",gap:8}}><Loader2 size={18} className="animate-spin"/> Generating...</strong></div> : address ? <div className="deposit-qr-layout"><div className="deposit-qr-card"><img src={qrUrl} alt={`${asset} ${network} deposit address QR code`} width="220" height="220" loading="eager" referrerPolicy="no-referrer" /><span>Scan to deposit</span></div><div className="deposit-address-box"><span>{asset} on {network} ({networkShort}) deposit address</span><strong>{address}</strong><button type="button" onClick={copyAddress}><Copy size={17}/> {copied ? "Copied" : "Copy address"}</button></div></div> : <div className="deposit-address-box"><strong>Address unavailable</strong><span>{error || "Unable to provision an address."}</span></div>}<div className="deposit-security-note"><ShieldCheck size={18}/><span>This address is assigned to your Orbitex account. Always verify the network before sending funds.</span></div></div>{verificationSupported && <form onSubmit={submitDeposit} className="deposit-submit-form"><div className="deposit-address-title"><span className="wallet-kicker">VERIFY YOUR TRANSFER</span><h3>Submit transaction</h3></div><label>Amount sent<input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00 USDT" /></label><label>Transaction hash<input value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="0x..." autoComplete="off" /></label>{error && <p className="deposit-error">{error}</p>}{message && <p className="deposit-success">{message}</p>}<button className="deposit-submit-button" type="submit" disabled={submitting}><Send size={17}/> {submitting ? "Verifying..." : "Submit deposit"}</button></form>}{!verificationSupported && <div className="deposit-security-note" style={{marginTop:14}}><span>Address provisioning is ready. Automatic on-chain crediting for this asset/network will be enabled as its chain adapter is added.</span></div>}<Link href="/wallet/deposit" className="mobile-back-button" style={{display:"flex",marginTop:14}}><ArrowLeft size={17}/> Choose another asset</Link></div></section></div><MobileNav/></main>;
}

export default function DepositAddressPage() { return <Suspense fallback={<main className="wallet-page" />}><DepositAddressContent /></Suspense>; }
