"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LogOut, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

export default function SecurityPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email || "");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setSignedOut(true);
    window.location.href = "/login?next=/dashboard";
  };

  if (loading) {
    return <main className="security-page"><div className="security-card">Loading security settings…</div></main>;
  }

  return (
    <main className="security-page">
      <div className="security-shell">
        <Link href="/dashboard" className="security-back"><ArrowLeft size={17} /> Back to dashboard</Link>
        <section className="security-card">
          <div className="security-heading">
            <span className="security-icon"><ShieldCheck size={25} /></span>
            <div><span className="security-eyebrow">ACCOUNT SETTINGS</span><h1>Account security</h1><p>Review your authenticated session and manage access to your Orbitex account.</p></div>
          </div>
          <div className="security-status"><CheckCircle2 size={20} /><div><strong>Authenticated session</strong><span>Your account is currently signed in securely.</span></div></div>
          <div className="security-detail"><span>Signed-in email</span><strong>{email || "Not available"}</strong></div>
          <div className="security-detail"><span>Session status</span><strong className="security-green">Active</strong></div>
          <button type="button" className="security-logout" onClick={signOut} disabled={signedOut}><LogOut size={17} /> {signedOut ? "Signing out…" : "Sign out of this account"}</button>
        </section>
      </div>
      <style jsx>{`
        .security-page{min-height:100vh;background:#050a11;color:#eef4ff;padding:42px 20px;box-sizing:border-box}
        .security-shell{width:100%;max-width:820px;margin:0 auto}
        .security-back{display:inline-flex;align-items:center;gap:8px;color:#82baff;text-decoration:none;font-size:14px;margin-bottom:22px}
        .security-card{border:1px solid #1d3048;border-radius:18px;background:linear-gradient(180deg,#0b1521,#08111b);padding:30px;box-shadow:0 20px 60px #0005}
        .security-heading{display:flex;gap:16px;align-items:flex-start;padding-bottom:26px;border-bottom:1px solid #1b2b40}
        .security-icon{display:grid;place-items:center;width:50px;height:50px;border-radius:14px;background:#102b48;color:#68b0ff}
        .security-eyebrow{color:#7f9ab8;font-size:11px;letter-spacing:2px;font-weight:700}
        h1{margin:5px 0 8px;font-size:30px;letter-spacing:-.5px}
        p{margin:0;color:#91a4ba;font-size:14px;line-height:1.6}
        .security-status{display:flex;align-items:center;gap:12px;margin:24px 0;padding:16px;border:1px solid #194a3a;border-radius:12px;background:#092219;color:#45d18a}
        .security-status div{display:grid;gap:4px}.security-status strong{color:#e5fff0;font-size:14px}.security-status span{color:#8fbca5;font-size:12px}
        .security-detail{display:flex;justify-content:space-between;gap:20px;padding:17px 0;border-bottom:1px solid #18283a;color:#8ea1b8;font-size:14px}.security-detail strong{color:#eaf2fc;font-weight:600}.security-green{color:#45d18a!important}
        .security-logout{display:inline-flex;align-items:center;justify-content:center;gap:9px;margin-top:24px;min-height:46px;padding:0 18px;border:1px solid #633143;border-radius:10px;background:#24121b;color:#ff8da2;font-weight:700;cursor:pointer}.security-logout:disabled{opacity:.6;cursor:wait}
        @media(max-width:560px){.security-page{padding:24px 14px}.security-card{padding:22px}.security-heading{gap:12px}h1{font-size:25px}.security-detail{display:grid;gap:7px}}
      `}</style>
    </main>
  );
}
