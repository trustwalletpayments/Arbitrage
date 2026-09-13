"use client";

import Link from "next/link";
import { ArrowLeft, Copy, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import MobileNav from "../../../components/MobileNav";
import "../../wallet.css";
import "../deposit.css";

const ADDRESSES: Record<string, string> = {
  bsc: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83",
  eth: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83",
  arbitrum: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83",
  tron: "TKqK2iAEKFC7M5RA12gBdskBLGNdtrTH3q3",
  bitcoin: "bc1q3nu0hklvvnkzfsd6e8g8e29kzd8q9k6mw4ssk2",
  solana: "79z3yH2t7BcWdSJYx1V9CftpwEDjXS6JryVPTMtLPQJF",
  aptos: "0x78faf651ee5fab278b1e93e2117bff92bedc182d1077e9d2710a14aedc164fc3",
  ton: "UQCFeiYwfU9xPr5RkY9-X11HcYLMGPFq766OXZ5a0qyI_9dt",
  near: "7fb16d6c760050f8ff099b67a8b91db5762d835be5d257b0d4cb97af1cd0c909",
  polygon: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83",
  optimism: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83",
  base: "0x43A690962edb1a5198E856E95fdEE68cFF4F0E83",
};

const BNB_USDT_QR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA3AAAANwCAIAAADhiB+AAAAQAElEQVR4Aezd";

export default function DepositAddressPage() {
  const [details, setDetails] = useState({ asset: "USDT", assetName: "Tether", network: "BNB Smart Chain", networkShort: "BEP-20", networkId: "bsc" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDetails({ asset: params.get("asset") || "USDT", assetName: params.get("assetName") || "Tether", network: params.get("network") || "BNB Smart Chain", networkShort: params.get("networkShort") || "BEP-20", networkId: params.get("networkId") || "bsc" });
  }, []);

  const { asset, assetName, network, networkShort, networkId } = details;
  const address = ADDRESSES[networkId] || "";
  const isBnbUsdt = asset === "USDT" && networkId === "bsc";

  async function copyAddress() {
    if (!address) return;
    try { await navigator.clipboard.writeText(address); } catch {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="wallet-page">
      <header className="wallet-header">
        <Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link>
        <Link href="/wallet/deposit" className="history-link"><ArrowLeft size={18} /> Back to Deposit</Link>
      </header>
      <div className="wallet-content deposit-content">
        <div className="wallet-heading">
          <span className="wallet-kicker">FUND YOUR ACCOUNT</span>
          <h1>Deposit {asset}</h1>
          <p>Send only {asset} through the selected network to the address below.</p>
        </div>
        <section className="deposit-address-page-card">
          <Link href="/wallet/deposit" className="mobile-back-button"><ArrowLeft size={17} /> Choose another network</Link>
          <div className="deposit-address-title">
            <span className="wallet-kicker">YOUR DEPOSIT ADDRESS</span>
            <h2>{assetName} ({asset})</h2>
            <p>This is your <strong>{asset} deposit address on {network} ({networkShort})</strong>. Only send {asset} using this exact network.</p>
          </div>
          {isBnbUsdt ? (
            <div className="deposit-qr-placeholder">
              <img src={BNB_USDT_QR} alt="USDT on BNB Smart Chain deposit QR code" style={{ display: "block", width: "220px", height: "220px", objectFit: "contain" }} />
              <span>USDT on BNB Smart Chain</span>
            </div>
          ) : (
            <div className="deposit-qr-placeholder deposit-qr-unavailable"><span>QR code is available only for USDT on BNB Smart Chain.</span></div>
          )}
          <div className="deposit-address-box">
            <span>{asset} on {network} — {networkShort} deposit address</span>
            <strong>{address || "Address not configured for this network"}</strong>
            {address && <button type="button" onClick={copyAddress}><Copy size={17} /> {copied ? "Copied" : "Copy address"}</button>}
          </div>
          <div className="deposit-security-note"><ShieldCheck size={18} /><span>Network warning: sending another asset or using a different network may permanently result in lost funds.</span></div>
        </section>
      </div>
      <MobileNav />
    </main>
  );
}
