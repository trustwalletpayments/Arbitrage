"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Gift, Users, ArrowLeft } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import "../program-page.css";

export default function ReferralPage() {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const code = email ? email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() || "ORBITEX" : "ORBITEX";
  const link = typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${code}` : `/signup?ref=${code}`;

  useEffect(() => {
    createSupabaseBrowserClient().auth.getUser().then(({ data }) => setEmail(data.user?.email || ""));
  }, []);

  async function copyLink() {
    await navigator.clipboard?.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <main className="program-page"><div className="program-shell"><Link href="/dashboard" className="program-back"><ArrowLeft size={16} /> Back to dashboard</Link><div className="program-icon"><Users size={28} /></div><div className="program-eyebrow">ORBITEX COMMUNITY</div><h1>Referral Program</h1><p className="program-lead">Invite friends to Orbitex and grow the community together.</p><section className="program-card"><div className="program-card-title"><Gift size={20} /><span>Your referral link</span></div><div className="referral-link"><span>{link}</span><button type="button" onClick={copyLink} aria-label="Copy referral link"><Copy size={17} /></button></div>{copied && <div className="program-success">Referral link copied.</div>}<div className="program-code">Referral code: <strong>{code}</strong></div></section><section className="program-steps"><div><strong>1. Share your link</strong><span>Send your unique referral link to friends.</span></div><div><strong>2. Friends sign up</strong><span>Your referrals register through your link.</span></div><div><strong>3. Track activity</strong><span>Referral rewards and eligibility will appear here when enabled.</span></div></section></div></main>;
}
