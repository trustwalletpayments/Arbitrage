import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./global-theme.css";
import "./orbitex.css";
import "./orbitex-internal.css";
import "./logo-overrides.css";
import "./home-redesign.css";
import "./market-card-fix.css";
import "./store-badge-overrides.css";
import "./footer-redesign.css";
import "./footer-binance.css";
import "./download-buttons.css";
import "./security-icon.css";
import "./market-scroll.css";
import "./trading-ui.css";
import "./components/mobile-nav.css";
import "./usdt-bnb-logo.css";
import "./qr-fix.css";
import "./futures-page.css";
import "./orbitex-learning.css";
import ScrollGuard from "./components/ScrollGuard";
import AuthGuard from "./components/AuthGuard";
import MobileNav from "./components/MobileNav";
import AccountMoreMenu from "./components/AccountMoreMenu";
import OrbitexEnhancements from "./components/OrbitexEnhancements";

export const metadata: Metadata = {
  title: "ORBITEX Exchange",
  description: "ORBITEX crypto exchange platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ScrollGuard />
        <AuthGuard />
        {children}
        <MobileNav />
        <AccountMoreMenu />
        <OrbitexEnhancements />
      </body>
    </html>
  );
}
