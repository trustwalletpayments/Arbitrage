"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, Repeat2, ChartCandlestick, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

export default function MobileNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const setup = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setIsLoggedIn(Boolean(data.user));

        // Register the listener only after auth initialization has completed.
        // This prevents refresh/navigation races in Supabase Auth.
        const result = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted && session?.user) setIsLoggedIn(true);
          if (mounted && _event === "SIGNED_OUT") setIsLoggedIn(false);
        });
        subscription = result.data.subscription;
      } catch {
        // A temporary auth/network error must not sign the member out.
        if (mounted) setIsLoggedIn(false);
      }
    };

    setup();
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // The landing page should remain clean; bottom navigation is for app pages only.
  if (pathname === "/" || !isLoggedIn) return null;

  const item = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) ? "active" : "";

  return (
    <nav className="mobile-nav" aria-label="Primary navigation">
      <Link className={item("/dashboard")} href="/dashboard"><Home size={27} strokeWidth={2} /><span>Home</span></Link>
      <Link className={item("/markets")} href="/markets"><LineChart size={27} strokeWidth={2} /><span>Markets</span></Link>
      <Link className={item("/trade")} href="/trade"><Repeat2 size={27} strokeWidth={2} /><span>Trade</span></Link>
      <Link className={item("/futures")} href="/futures"><ChartCandlestick size={27} strokeWidth={2} /><span>F&amp;O</span></Link>
      <Link className={item("/wallet")} href="/wallet"><WalletCards size={27} strokeWidth={2} /><span>Assets</span></Link>
    </nav>
  );
}
