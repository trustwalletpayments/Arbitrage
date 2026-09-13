"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Check, Copy, Globe, KeyRound, LogOut, Mail, Monitor, Moon, Phone, QrCode, ShieldCheck, Smartphone, Sun, Trash2, UserRound, Users, X } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import "./profile.css";
import "./theme.css";

type Theme = "dark" | "light" | "system";

type NotificationSettings = {
  security: boolean;
  orders: boolean;
  deposits: boolean;
  marketing: boolean;
};

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
  const [theme, setTheme] = useState<Theme>("dark");
  const [language, setLanguage] = useState("English");
  const [currency, setCurrency] = useState("USD");
  const [notifications, setNotifications] = useState<NotificationSettings>({ security: true, orders: true, deposits: true, marketing: false });

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
    const savedTheme = window.localStorage.getItem("orbitex-theme");
    if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") setTheme(savedTheme);
    return () => { mounted = false; };
  }, [router, supabase]);

  useEffect(() => {
    document.documentElement.dataset.orbitexTheme = theme;
    window.localStorage.setItem("orbitex-theme", theme);
  }, [theme]);

  const displayName = email.split("@")[0] || "User";
  const uid = `ORB-${(email || "USER").replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase() || "USER"}-82931`;
  const referralId = `ORB${displayName.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() || "USER"}100`;
  const referralLink = typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${referralId}` : `https://newexchann.vercel.app/signup?ref=${referralId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(referralLink)}`;

  const copy = async (value: string, label: string) => {
    await navigator.clipboard?.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1800);
  };
  const updateEmail = async () => { if (!newEmail.trim()) return; const { error } = await supabase.auth.updateUser({ email: newEmail.trim() }); setNotice(error ? error.message : "A confirmation link was sent to your new email address."); if (!error) { setNewEmail(""); setShowEmail(false); } };
  const updatePhone = async () => { if (!newPhone.trim()) return; const { error } = await supabase.auth.updateUser({ phone: newPhone.trim() }); setNotice(error ? error.message : "Your phone number update request was submitted."); if (!error) { setNewPhone(""); setShowPhone(false); } };
  const updatePassword = async () => { if (newPassword.length < 8) { setNotice("Use a password with at least 8 characters."); return; } const { error } = await supabase.auth.updateUser({ password: newPassword }); setNotice(error ? error.message : "Password updated successfully."); if (!error) { setNewPassword(""); setShowPassword(false); } };
  const logout = async () => { await supabase.auth.signOut(); router.replace("/login"); };
  const toggleNotification = (key: keyof NotificationSettings) => setNotifications((current) => ({ ...current, [key]: !current[key] }));

  return (
    <main className={`profile-page ${theme === "light" ? "theme-light" : ""} ${theme === "system" ? "theme-system" : ""}`}>
      <header className="profile-header">
        <Link href="/dashboard" className="back-link"><ArrowLeft size={18} /> Back to dashboard</Link>
        <Link href="/dashboard" className="profile-brand"><span className="brand-mark">◉</span> ORBITEX<span className="brand-dot">.</span></Link>
        <button className="header-logout" onClick={logout}><LogOut size={17} /> Log out</button>
      </header>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
          <strong>{email || "Your account"}</strong>
          <span className="account-status"><Check size={13} /> Account active</span>
          <div className="account-meta"><span>UID</span><strong>{uid}</strong><button onClick={() => copy(uid, "uid")} aria-label="Copy UID"><Copy size={14} /></button></div>
          <nav><a className="active" href="#account">Account</a><a href="#security">Security</a><a href="#preferences">Preferences</a><a href="#notifications">Notifications</a><a href="#referral">Referral program</a></nav>
        </aside>

        <section className="profile-content">
          <div className="profile-title">
            <div><span className="eyebrow">USER PROFILE</span><h1>Account settings</h1><p>Manage your account, security, preferences and referral rewards.</p></div>
            <div className="theme-switcher"><button className={theme === "dark" ? "selected" : ""} onClick={() => setTheme("dark")}><Moon size={16} /> Dark</button><button className={theme === "light" ? "selected" : ""} onClick={() => setTheme("light")}><Sun size={16} /> Light</button><button className={theme === "system" ? "selected" : ""} onClick={() => setTheme("system")}><Monitor size={16} /> System</button></div>
          </div>

          {notice && <div className="profile-notice">{notice}<button onClick={() => setNotice("")}><X size={16} /></button></div>}

          <div className="quick-actions" aria-label="Quick actions"><a href="#security"><ShieldCheck size={16} /> Security</a><a href="#preferences"><Sun size={16} /> Appearance</a><a href="#notifications"><Bell size={16} /> Notifications</a><a href="#referral"><Users size={16} /> Referrals</a></div>

          <section className="settings-card" id="account"><div className="card-heading"><div><span className="card-kicker">PROFILE</span><h2>Personal information</h2><p>Update the contact details connected to your account.</p></div><UserRound size={21} /></div><div className="setting-row"><div className="setting-icon"><Mail size={19} /></div><div className="setting-copy"><span>Email address</span><strong>{email || "Not available"}</strong></div><button className="outline-button" onClick={() => setShowEmail(!showEmail)}>{showEmail ? "Cancel" : "Change"}</button></div>{showEmail && <div className="inline-editor"><input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="New email address" /><button onClick={updateEmail}>Save email</button></div>}<div className="setting-row"><div className="setting-icon"><Phone size={19} /></div><div className="setting-copy"><span>Phone number</span><strong>{phone || "Not added"}</strong></div><button className="outline-button" onClick={() => setShowPhone(!showPhone)}>{showPhone ? "Cancel" : phone ? "Change" : "Add"}</button></div>{showPhone && <div className="inline-editor"><input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} type="tel" placeholder="New phone number" /><button onClick={updatePhone}>Save number</button></div>}</section>

          <section className="settings-card" id="security"><div className="card-heading"><div><span className="card-kicker">PROTECTION</span><h2>Security</h2><p>Protect your account and review access settings.</p></div><ShieldCheck size={21} /></div><div className="setting-row"><div className="setting-icon"><KeyRound size={19} /></div><div className="setting-copy"><span>Password</span><strong>Keep your password private and unique</strong></div><button className="outline-button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Cancel" : "Change"}</button></div>{showPassword && <div className="inline-editor"><input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="New password" /><button onClick={updatePassword}>Update password</button></div>}<div className="setting-row"><div className="setting-icon"><Smartphone size={19} /></div><div className="setting-copy"><span>Two-factor authentication</span><strong>Additional protection for account access</strong></div><button className="outline-button" onClick={() => setNotice("Two-factor authentication setup will be available when the authenticator connection is enabled.")}>Set up</button></div><div className="setting-row"><div className="setting-icon"><Monitor size={19} /></div><div className="setting-copy"><span>Active sessions</span><strong>Review browsers and signed-in devices</strong></div><button className="outline-button" onClick={() => setNotice("Session management will be available in a future update.")}>Manage</button></div></section>

          <section className="settings-card" id="preferences"><div className="card-heading"><div><span className="card-kicker">CUSTOMIZE</span><h2>Preferences</h2><p>Choose how Orbitex looks and displays information.</p></div><Globe size={21} /></div><div className="preference-grid"><label><span>Language</span><select value={language} onChange={(e) => setLanguage(e.target.value)}><option>English</option><option>Hindi</option><option>Spanish</option></select></label><label><span>Display currency</span><select value={currency} onChange={(e) => setCurrency(e.target.value)}><option>USD</option><option>EUR</option><option>INR</option><option>GBP</option></select></label></div><div className="theme-preference"><div className="setting-icon">{theme === "light" ? <Sun size={19} /> : theme === "system" ? <Monitor size={19} /> : <Moon size={19} />}</div><div className="setting-copy"><span>Appearance</span><strong>{theme === "system" ? "Follow device theme" : `${theme === "dark" ? "Dark" : "Light"} theme selected`}</strong></div><div className="theme-switcher compact"><button className={theme === "dark" ? "selected" : ""} onClick={() => setTheme("dark")}><Moon size={15} /></button><button className={theme === "light" ? "selected" : ""} onClick={() => setTheme("light")}><Sun size={15} /></button><button className={theme === "system" ? "selected" : ""} onClick={() => setTheme("system")}><Monitor size={15} /></button></div></div></section>

          <section className="settings-card" id="notifications"><div className="card-heading"><div><span className="card-kicker">ALERTS</span><h2>Notifications</h2><p>Control the updates you want to receive.</p></div><Bell size={21} /></div>{Object.entries({ security: "Security alerts", orders: "Order and trade updates", deposits: "Deposit and withdrawal updates", marketing: "Product and promotional updates" }).map(([key, label]) => <div className="setting-row notification-row" key={key}><div className="setting-icon"><Bell size={19} /></div><div className="setting-copy"><span>{label}</span><strong>{notifications[key as keyof NotificationSettings] ? "Enabled" : "Disabled"}</strong></div><button className={`toggle ${notifications[key as keyof NotificationSettings] ? "on" : ""}`} onClick={() => toggleNotification(key as keyof NotificationSettings)} aria-label={`Toggle ${label}`}><span /></button></div>)}</section>

          <section className="settings-card referral-card" id="referral"><div className="card-heading"><div><span className="card-kicker">REWARDS</span><h2>Referral program</h2><p>Invite friends and track your eligible referral rewards.</p></div><QrCode size={21} /></div><div className="referral-summary"><div><strong>0</strong><span>Total referrals</span></div><div><strong>$0.00</strong><span>Rewards earned</span></div><div><strong>0</strong><span>Successful referrals</span></div></div><div className="referral-grid"><div className="referral-copy"><p>Share your personal referral link with friends. Referral rewards are credited according to the current program terms.</p><div className="ref-field"><label>Referral ID</label><div><span>{referralId}</span><button onClick={() => copy(referralId, "id")}><Copy size={16} />{copied === "id" ? "Copied" : "Copy"}</button></div></div><div className="ref-field"><label>Referral link</label><div><span>{referralLink}</span><button onClick={() => copy(referralLink, "link")}><Copy size={16} />{copied === "link" ? "Copied" : "Copy"}</button></div></div></div><div className="referral-poster"><img src={qrUrl} alt="Referral QR code" /><strong>Invite friends</strong><span>Scan to join ORBITEX</span></div></div></section>

          <section className="settings-card danger-card"><div className="card-heading"><div><span className="card-kicker danger-text">ACCOUNT CONTROL</span><h2>Danger zone</h2><p>These actions can affect access to your account.</p></div><Trash2 size={21} /></div><button className="danger-button" onClick={() => setNotice("Please contact support if you need to disable or close your account.")}><Trash2 size={16} /> Request account closure</button></section>
        </section>
      </div>
    </main>
  );
}
