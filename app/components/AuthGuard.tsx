"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/wallet",
  "/markets",
  "/trade",
  "/futures",
  "/profile",
  "/orders",
  "/security",
];

export default function AuthGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return;

    const supabase = createSupabaseBrowserClient();
    let mounted = true;
    let initialized = false;
    let subscription: { unsubscribe: () => void } | null = null;

    const verify = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      initialized = true;
      if (!data.user && !error) router.replace(`/login?next=${encodeURIComponent(pathname)}`);

      if (!mounted) return;
      const result = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        if (session?.user) return;
        if (event === "SIGNED_OUT" && initialized) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
      });
      subscription = result.data.subscription;
    };

    verify();
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [pathname, router]);

  return null;
}
