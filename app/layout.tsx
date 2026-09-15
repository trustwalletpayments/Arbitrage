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
import ScrollGuard from "./components/ScrollGuard";
import AuthGuard from "./components/AuthGuard";

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

const themeScript = `(() => {
  try {
    const saved = localStorage.getItem('orbitex-theme');
    const theme = saved === 'light' || saved === 'system' ? saved : 'dark';
    document.documentElement.dataset.orbitexTheme = theme;
  } catch {}
})();`;

const enhanceScript = `(() => {
  const enhancePage = () => {
    try {
      if ('scrollRestoration' in history) history.scrollRestoration = 'auto';
    } catch {}

    document.querySelectorAll('.premium-footer .footer-group[open]').forEach((group) => {
      group.removeAttribute('open');
    });

    const box = document.querySelector('.store-buttons');
    if (!box || box.dataset.enhanced === '1') return;
    box.dataset.enhanced = '1';
    box.innerHTML = '';

    const play = document.createElement('a');
    play.className = 'store-download store-play';
    play.href = '/playstore-demo';
    play.setAttribute('aria-label', 'Open ORBITEX PlayStore demo');
    play.innerHTML = '<span class="store-download-copy"><small>GET IT ON</small><b>PlayStore</b></span><span class="store-download-arrow">›</span>';

    const apk = document.createElement('a');
    apk.className = 'store-download store-apk';
    apk.href = '/apk-demo';
    apk.setAttribute('aria-label', 'Open ORBITEX APK demo');
    apk.innerHTML = '<span class="store-download-copy"><small>DOWNLOAD</small><b>APK</b></span><span class="store-download-arrow">›</span>';

    box.append(play, apk);
  };

  const start = () => {
    enhancePage();
    window.setTimeout(enhancePage, 250);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ScrollGuard />
        <AuthGuard />
        {children}
        <script dangerouslySetInnerHTML={{ __html: enhanceScript }} />
      </body>
    </html>
  );
}
