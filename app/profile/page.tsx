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
        <Link href="/dashboard" className="profile-brand">ORBITEX</Link>
        <button className="header-logout" onClick={logout}><LogOut size={17} /> Log out</button>
      </header>

      <div className="profile-layout">