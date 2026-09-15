import type { ReactNode } from "react";

export default function DepositLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        /* The root layout already renders MobileNav. Hide the duplicate
           instance rendered by the legacy deposit pages to prevent overlays
           and intermittent blank-looking deposit screens. */
        .wallet-page > .mobile-nav { display: none !important; }
        .wallet-page { position: relative; isolation: isolate; }
        .deposit-shell, .deposit-selector, .deposit-details {
          min-height: 0;
          contain: layout paint;
        }
        .deposit-qr-placeholder img {
          display: block;
          max-width: 100%;
          max-height: 100%;
        }
      `}</style>
      {children}
    </>
  );
}
