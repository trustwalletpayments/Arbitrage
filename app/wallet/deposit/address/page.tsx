"use client";

import Link from "next/link";
import { ArrowLeft, Copy, ShieldCheck } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MobileNav from "../../../components/MobileNav";
import { createSupabaseBrowserClient } from "../../../../lib/supabase-browser";
import "../../wallet.css";
import "../deposit.css";
import "./address.css";

function DepositAddressContent() {
  const params = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const asset = params.get("asset") || "USDT";
  const assetName = params.get("assetName") || "Tether";
  const network = params.get("network") || "BNB Smart Chain";
  const networkShort = params.get("networkShort") || "BEP-20";
  const networkId = params.get("networkId") || "bsc";
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadAddress() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || asset !== "USDT" || networkId !== "bsc") {
        if (mounted) { setAddress(null); setLoading(false); }
        return;
      }
      const { data } = await supabase.from("wallet_accounts").select("deposit_address, status").eq("user_id", user.id).eq("asset", "USDT").eq("network", "BEP20").maybeSingle();
      if (mounted) { setAddress(data?.deposit_address || null); setLoading(false); }
    }
    loadAddress();
    return () => { mounted = false; };
  }, [supabase, asset, networkId]);

  async function copyAddress() {
    if (!address) return;
    try { await navigator.clipboard.writeText(address); } catch {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <main className="wallet-page"><header className="wallet-header"><Link href="/wallet" className="wallet-brand"><span className="brand-mark">◉</span> ORBITEX</Link><Link href="/wallet/deposit" className="history-link"><ArrowLeft size={18}/> Back to Deposit</Link></header><div className="wallet-content deposit-content"><div className="wallet-heading"><div><span className="wallet-kicker">FUND YOUR ACCOUNT</span><h1>Deposit address</h1><p>Use the assigned address and network shown below.</p></div></div><section className="deposit-shell deposit-address-only"><div className="deposit-details withdraw-form mobile-visible"><div className="selected-asset-heading"><div className="deposit-asset-logo"><span>{asset.slice(0, 2)}</span></div><div><span className="wallet-kicker">DEPOSIT ASSET</span><h2>{assetName} <em>{asset}</em></h2></div></div><div className="deposit-address-step"><div className="deposit-address-title"><span className="wallet-kicker">YOUR DEPOSIT ADDRESS</span><h3>{asset} on {networkShort}</h3><p>Send only <strong>{asset}</strong> using the <strong>{network}</strong> network.</p></div>{loading ? <div className="deposit-address-box"><strong>Loading wallet address...</strong></div> : address ? <><div className="deposit-address-box"><span>{asset} on {network} ({networkShort}) deposit address</span><strong>{address}</strong><button type="button" onClick={copyAddress}><Copy size={17}/> {copied ? "Copied" : "Copy address"}</button></div><div className="deposit-security-note"><ShieldCheck size={18}/><span>Confirm the asset, network, and full address before sending. Wrong-network deposits may be permanently lost.</span></div></> : <div className="deposit-address-box"><strong>Wallet address not available yet</strong><span>Orbitex must provision and activate your custodial deposit wallet before deposits can be accepted.</span></div>}</div><Link href="/wallet/deposit" className="mobile-back-button" style={{display:"flex",marginTop:14}}><ArrowLeft size={17}/> Choose another asset</Link></div></section></div><MobileNav/></main>;
}

export default function DepositAddressPage() { return <Suspense fallback={<main className="wallet-page" />}><DepositAddressContent /></Suspense>; }
