"use client";

import Link from "next/link";
import { ArrowLeft, Copy, ShieldCheck } from "lucide-react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import MobileNav from "../../../components/MobileNav";
import "../../wallet.css";
import "../deposit.css";
import "./address.css";

const TREASURY_ADDRESS = "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83";

function DepositAddressContent() {
  const params = useSearchParams();
  const asset = params.get("asset") || "USDT";
  const assetName = params.get("assetName") || "Tether";
  const network = params.get("network") || "BNB Smart Chain";
  const networkShort = params.get("networkShort") || "BEP-20";
  const networkId = params.get("networkId") || "bsc";
  const [copied, setCopied] = useState(false);

  const supported = asset === "USDT" && networkId === "bsc";

  async function copyAddress() {
    try { await navigator.clipboard.writeText(TREASURY_ADDRESS); } catch {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <main className="wallet-page"><header className="wallet-header"><Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link><Link href="/wallet/deposit" className="history-link"><ArrowLeft size={18}/> Back to Deposit</Link></header><div className="wallet-content deposit-content"><div className="wallet-heading"><div><span className="wallet-kicker">FUND YOUR ACCOUNT</span><h1>Deposit address</h1><p>Send funds only to the address and network shown below.</p></div></div><section className="deposit-shell deposit-address-only"><div className="deposit-details withdraw-form mobile-visible"><div className="selected-asset-heading"><div className="deposit-asset-logo"><span>{asset.slice(0, 2)}</span></div><div><span className="wallet-kicker">DEPOSIT ASSET</span><h2>{assetName} <em>{asset}</em></h2></div></div>{supported ? <div className="deposit-address-step"><div className="deposit-address-title"><span className="wallet-kicker">ORBITEX TREASURY ADDRESS</span><h3>{asset} on {networkShort}</h3><p>Send only <strong>{asset}</strong> using the <strong>{network}</strong> network.</p></div><div className="deposit-address-box"><span>{asset} on {network} ({networkShort}) deposit address</span><strong>{TREASURY_ADDRESS}</strong><button type="button" onClick={copyAddress}><Copy size={17}/> {copied ? "Copied" : "Copy address"}</button></div><div className="deposit-security-note"><ShieldCheck size={18}/><span>After sending, submit your transaction hash for verification. Deposits are credited only after the blockchain transaction is verified. Wrong-network deposits may be permanently lost.</span></div></div> : <div className="deposit-address-box"><strong>Network not supported</strong><span>Only USDT on BNB Smart Chain (BEP-20) is currently supported.</span></div>}<Link href="/wallet/deposit" className="mobile-back-button" style={{display:"flex",marginTop:14}}><ArrowLeft size={17}/> Choose another asset</Link></div></section></div><MobileNav/></main>;
}

export default function DepositAddressPage() { return <Suspense fallback={<main className="wallet-page" />}><DepositAddressContent /></Suspense>; }
