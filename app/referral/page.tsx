"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Gift, Link2, MessageCircle, Send, Users, Wallet } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import "../program-page.css";

const REFERRER_RATE = 15;
const FRIEND_RATE = 20;
const REQUIRED_REFERRALS = 5;

type Referral = {
  id: string;
  status: "registered" | "qualifying" | "rejected";
  qualifying_deposit_amount: number;
  referrer_reward_amount: number;
  created_at: string;
};

type Claim = { amount: number; status: string; submitted_at: string };

const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ReferralPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("ORBITEX");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadReferralData() {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const [{ data: profile }, { data: referralRows }, { data: claimRows }] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", user.id).maybeSingle(),
        supabase.from("referrals").select("id,status,qualifying_deposit_amount,referrer_reward_amount,created_at").eq("referrer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("reward_claims").select("amount,status,submitted_at").eq("user_id", user.id).eq("claim_type", "referral").order("submitted_at", { ascending: false }),
      ]);

      setCode(profile?.referral_code || "ORBITEX");
      setReferrals((referralRows || []) as Referral[]);
      setClaims((claimRows || []) as Claim[]);
      setLoading(false);
    }

    loadReferralData();
  }, [supabase]);

  const link = typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${code}` : `/signup?ref=${code}`;
  const qualifying = referrals.filter((item) => item.status === "qualifying");
  const totalEarned = qualifying.reduce((sum, item) => sum + Number(item.referrer_reward_amount || 0), 0);
  const paidRewards = claims.filter((claim) => claim.status === "paid").reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const pendingRewards = claims.filter((claim) => ["pending_review", "under_review", "approved"].includes(claim.status)).reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
  const claimable = qualifying.length >= REQUIRED_REFERRALS ? Math.max(totalEarned - paidRewards - pendingRewards, 0) : 0;
  const locked = Math.max(totalEarned - paidRewards - pendingRewards - claimable, 0);

  async function copyLink() {
    await navigator.clipboard?.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function requestClaim() {
    if (!userId || claimable <= 0 || claiming) return;
    setClaiming(true);
    setMessage("");
    const { error } = await supabase.from("reward_claims").insert({ user_id: userId, claim_type: "referral", amount: Number(claimable.toFixed(8)), status: "pending_review" });
    if (error) setMessage(error.message);
    else {
      setMessage("Claim request submitted. The Orbitex team will review it and arrange manual payment if approved.");
      setClaims((current) => [{ amount: claimable, status: "pending_review", submitted_at: new Date().toISOString() }, ...current]);
    }
    setClaiming(false);
  }

  return (
    <main className="program-page">
      <div className="program-shell referral-shell">
        <Link href="/dashboard" className="program-back"><ArrowLeft size={16} /> Back to dashboard</Link>
        <div className="program-icon"><Users size={28} /></div>
        <div className="program-eyebrow">ORBITEX COMMUNITY</div>
        <h1>Referral Program</h1>
        <p className="program-lead">Invite friends, help them get started, and earn rewards when they complete qualifying deposits.</p>

        <section className="referral-hero-grid">
          <div className="referral-rate-card"><div className="rate-card-icon"><Gift size={20} /></div><div className="rate-card-label">Your referral reward</div><div className="rate-card-value">{REFERRER_RATE}%</div><p>of a referred user’s qualifying deposit</p></div>
          <div className="referral-rate-card referral-rate-card-accent"><div className="rate-card-icon"><Wallet size={20} /></div><div className="rate-card-label">Friend’s deposit bonus</div><div className="rate-card-value">{FRIEND_RATE}%</div><p>credited as a promotional bonus after eligibility checks</p></div>
        </section>

        <section className="program-card referral-link-card">
          <div className="program-card-title"><Link2 size={20} /><span>Your referral link</span></div>
          <div className="referral-link"><span>{link}</span><button type="button" onClick={copyLink} aria-label="Copy referral link">{copied ? <Check size={17} /> : <Copy size={17} />}</button></div>
          {copied && <div className="program-success">Referral link copied.</div>}
          <div className="program-code">Referral code: <strong>{code}</strong></div>
          <div className="referral-share-row"><button type="button" className="share-button" onClick={copyLink}><Copy size={15} /> Copy link</button><a className="share-button" href={`https://t.me/share/url?url=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer"><Send size={15} /> Telegram</a><a className="share-button" href={`https://wa.me/?text=${encodeURIComponent(`Join Orbitex using my referral link: ${link}`)}`} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a></div>
        </section>

        <section className="referral-stats-grid"><div className="stat-card"><span>Total referrals</span><strong>{loading ? "—" : referrals.length}</strong></div><div className="stat-card"><span>Qualifying referrals</span><strong>{loading ? "—" : `${qualifying.length}/${REQUIRED_REFERRALS}`}</strong></div><div className="stat-card"><span>Total earned</span><strong>{loading ? "—" : money(totalEarned)}</strong></div><div className="stat-card"><span>Paid rewards</span><strong>{loading ? "—" : money(paidRewards)}</strong></div></section>

        <section className="program-card referral-earnings-card">
          <div className="program-card-title"><Wallet size={20} /><span>Reward balance</span></div>
          <div className="earnings-row"><span>Locked rewards</span><strong>{money(locked)}</strong></div>
          <div className="earnings-row"><span>Eligible to claim</span><strong>{money(claimable)}</strong></div>
          <div className="earnings-row"><span>Pending review</span><strong>{money(pendingRewards)}</strong></div>
          <button type="button" className="claim-button" disabled={claimable <= 0 || claiming} onClick={requestClaim}>{claiming ? "Submitting…" : claimable > 0 ? "Request claim" : "Not eligible yet"}</button>
          {message && <div className="program-success">{message}</div>}
          <p className="program-muted">Referral rewards unlock after at least {REQUIRED_REFERRALS} qualifying referrals. Claims are reviewed manually and paid by the Orbitex team.</p>
        </section>

        <section className="program-card referral-rules-card"><div className="program-card-title"><Gift size={20} /><span>How it works</span></div><div className="program-steps referral-steps"><div><strong>1. Share your link</strong><span>Send your unique referral link to friends.</span></div><div><strong>2. Friend deposits</strong><span>Your friend completes a qualifying, confirmed deposit.</span></div><div><strong>3. Rewards unlock</strong><span>You earn 15%; your friend may receive a 20% promotional bonus after checks.</span></div><div><strong>4. Request a claim</strong><span>Once eligible, submit a claim for manual review.</span></div><div><strong>5. Team verifies</strong><span>Orbitex checks deposits and anti-abuse conditions.</span></div><div><strong>6. Manual payment</strong><span>Approved rewards are transferred manually and recorded with a transaction hash.</span></div></div></section>

        <section className="program-card referral-history-card"><div className="program-card-title"><Users size={20} /><span>Referral history</span></div>{referrals.length === 0 ? <div className="empty-state">Your referral activity will appear here after someone joins through your link.</div> : <div className="referral-history-list">{referrals.map((referral) => <div className="earnings-row" key={referral.id}><span>{new Date(referral.created_at).toLocaleDateString()} · {referral.status}</span><strong>{money(Number(referral.referrer_reward_amount || 0))}</strong></div>)}</div>}</section>
        <p className="program-disclaimer">Promotional rewards are subject to Orbitex eligibility rules, qualifying-deposit requirements, anti-abuse checks, manual approval, and applicable terms. Rewards are not automatic withdrawals or guaranteed returns.</p>
      </div>
    </main>
  );
}
