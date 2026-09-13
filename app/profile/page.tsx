"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, KeyRound, LogOut, Mail, Monitor, Phone, QrCode, ShieldCheck, Smartphone, Users, X } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import "./profile.css";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (!data.user) router.replace("/login?next=/profile");
      else {
        setEmail(data.user.email || "");
        setPhone(data.user.phone || "");
      }
    });
    supabase.auth.mfa.listFactors().then(({ data }) => {
      if (mounted) setMfaEnabled(Boolean(data?.all?.some((factor) => factor.status === "verified")));
    });
    return () => { mounted = false; };
  }, [router, supabase]);

  const referralId = `ORB${(email.split("@")[0] || "USER").replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase()}100`;
  const referralLink = typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${referralId}` : `https://newexchann.vercel.app/signup?ref=${referralId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(referralLink)}`;

  const copy = async (value: string, label: string) => {
    await navigator.clipboard?.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1800);
  };

  const updateEmail = async () => {
    if (!newEmail.trim()) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setNotice(error ? error.message : "Confirmation link sent to your new email address.");
    if (!error) { setNewEmail(""); setShowEmail(false); }
  };
  const updatePhone = async () => {
    if (!newPhone.trim()) return;
    const { error } = await supabase.auth.updateUser({ phone: newPhone.trim() });
    setNotice(error ? error.message : "A verification code has been sent to your new phone number.");
    if (!error) { setNewPhone(""); setShowPhone(false); }
  };
  const updatePassword = async () => {
    if (newPassword.length < 8) { setNotice("Use a password with at least 8 characters."); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setNotice(error ? error.message : "Password updated successfully.");
    if (!error) { setNewPassword(""); setShowPassword(false); }
  };
  const logout = async () => { await supabase.auth.signOut(); router.replace("/login"); };

  return (
    <main className="profile-page">
      <header className="profile-header">
        <Link href="/dashboard" className="back-link"><ArrowLeft size={18} /> Back to dashboard</Link>
        <Link href="/dashboard" className="profile-brand">ORBITEX<span>.</span></Link>
        <button className="header-logout" onClick={logout}><LogOut size={17} /> Log out</button>
      </header>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-avatar">{(email.split("@")[0] || "U").slice(0, 1).toUpperCase()}</div>
          <strong>{email || "Your account"}</strong>
          <span className="verified-pill"><Check size={13} /> Account verified</span>
          <nav><a className="active" href="#account">Account</a><a href="#security">Security</a><a href="#referral">Referral program</a></nav>
        </aside>

        <section className="profile-content">
          <div className="profile-title"><div><span className="eyebrow">USER PROFILE</span><h1>Account settings</h1><p>Manage your personal information, security and referral rewards.</p></div></div>
          {notice && <div className="profile-notice">{notice}<button onClick={() => setNotice("")}><X size={16} /></button></div>}

          <section className="settings-card" id="account"><div className="card-heading"><div><h2>Personal information</h2><p>Update the contact details connected to your account.</p></div><Users size={21} /></div>
            <div className="setting-row"><div className="setting-icon"><Mail size={19} /></div><div className="setting-copy"><span>Email address</span><strong>{email || "Not available"}</strong></div><button className="outline-button" onClick={() => setShowEmail(!showEmail)}>{showEmail ? "Cancel" : "Change"}</button></div>
            {showEmail && <div className="inline-editor"><input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="New email address" /><button onClick={updateEmail}>Save email</button></div>}
            <div className="setting-row"><div className="setting-icon"><Phone size={19} /></div><div className="setting-copy"><span>Phone number</span><strong>{phone || "Not added"}</strong></div><button className="outline-button" onClick={() => setShowPhone(!showPhone)}>{showPhone ? "Cancel" : phone ? "Change" : "Add"}</button></div>
            {showPhone && <div className="inline-editor"><input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} type="tel" placeholder="New phone number" /><button onClick={updatePhone}>Save number</button></div>}
          </section>

          <section className="settings-card" id="security"><div className="card-heading"><div><h2>Security</h2><p>Protect your account and review active access.</p></div><ShieldCheck size={21} /></div>
            <div className="setting-row"><div className="setting-icon"><KeyRound size={19} /></div><div className="setting-copy"><span>Password</span><strong>Last updated recently</strong></div><button className="outline-button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Cancel" : "Change"}</button></div>
            {showPassword && <div className="inline-editor"><input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="New password" /><button onClick={updatePassword}>Update password</button></div>}
            <div className="setting-row"><div className="setting-icon"><Smartphone size={19} /></div><div className="setting-copy"><span>Two-factor authentication</span><strong>{mfaEnabled ? "Enabled" : "Not enabled"}</strong></div><button className="outline-button" onClick={() => setNotice("Two-factor authentication setup is ready to connect to your authenticator app.")}>{mfaEnabled ? "Manage" : "Enable"}</button></div>
            <div className="setting-row"><div className="setting-icon"><Monitor size={19} /></div><div className="setting-copy"><span>Manage devices</span><strong>Review browsers and active sessions</strong></div><button className="outline-button" onClick={() => setNotice("Device management will show active sessions and allow you to sign out of other devices.")}>Manage</button></div>
          </section>

          <section className="settings-card referral-card" id="referral"><div className="card-heading"><div><h2>Referral program</h2><p>Invite friends and earn a $100 bonus for every eligible referral.</p></div><QrCode size={21} /></div>
            <div className="referral-grid"><div className="referral-copy"><div className="reward-box"><strong>$100</strong><span>Earn for every eligible referral</span></div><p>Join the ORBITEX referral program and share your personal link. When a referred member deposits $1,000, you receive a $100 referral bonus.</p><div className="ref-field"><label>Referral ID</label><div><span>{referralId}</span><button onClick={() => copy(referralId, "id")}><Copy size={16} />{copied === "id" ? "Copied" : "Copy"}</button></div></div><div className="ref-field"><label>Referral link</label><div><span>{referralLink}</span><button onClick={() => copy(referralLink, "link")}><Copy size={16} />{copied === "link" ? "Copied" : "Copy"}</button></div></div></div><div className="referral-poster"><img src={qrUrl} alt="Referral QR code" /><strong>Invite friends. Earn $100.</strong><span>Scan to join ORBITEX</span></div></div>
          </section>
        </section>
      </div>
    </main>
  );
}
