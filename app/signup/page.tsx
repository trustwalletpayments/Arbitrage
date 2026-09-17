"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound, Gift } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import "../auth.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const referralFromUrl = new URLSearchParams(window.location.search).get("ref");
    if (referralFromUrl) setReferralCode(referralFromUrl.toUpperCase());
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setMessage("");
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback`;

      const signupRequest = supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            referral_code: referralCode.trim().toUpperCase() || null,
          },
          emailRedirectTo,
        },
      });

      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              "Signup is taking too long. Please check your internet connection or try again."
            )
          );
        }, 15000);
      });

      const { error } = await Promise.race([signupRequest, timeout]);

      if (error) throw error;

      setMessage(
        "Your account has been created. We’ve sent a confirmation email to your inbox. Please confirm your email to activate your ORBITEX account."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <div className="auth-card">
        <Link className="brand" href="/">
          <img src="/orbitex-logo.svg" alt="" />
          <span>ORBITEX</span>
        </Link>

        <div className="auth-trust">
          <ShieldCheck /> Secure account creation
        </div>

        <div className="eyebrow">CREATE ACCOUNT</div>
        <h1>
          Join <span>ORBITEX</span>
        </h1>
        <p className="muted">
          Create your exchange account and get started with your trading dashboard.
        </p>

        <form onSubmit={submit}>
          <label>
            Full name
            <div className="auth-input">
              <UserRound />
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          </label>

          <label>
            Email
            <div className="auth-input">
              <Mail />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </label>

          <label>
            Password
            <div className="auth-input">
              <LockKeyhole />
              <input
                type={showPassword ? "text" : "password"}
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </label>

          <label>
            Referral code <span className="muted">(optional)</span>
            <div className="auth-input">
              <Gift />
              <input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                autoComplete="off"
                maxLength={50}
              />
            </div>
          </label>

          {message && <div className="notice">{message}</div>}

          <button className="btn primary full" disabled={loading} type="submit">
            {loading ? "Creating…" : "Create ORBITEX account"}
            <span>→</span>
          </button>
        </form>

        <div className="auth-divider">
          <span>ALREADY A MEMBER?</span>
        </div>

        <p className="auth-foot">
          Already registered? <Link href="/login">Log in <span>→</span></Link>
        </p>

        <div className="auth-security">
          <ShieldCheck />
          <span>Your account is protected by secure authentication.</span>
        </div>
      </div>
    </main>
  );
}
