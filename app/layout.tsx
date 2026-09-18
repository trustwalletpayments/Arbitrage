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
import MobileNav from "./components/MobileNav";
import AccountMoreMenu from "./components/AccountMoreMenu";

export const metadata: Metadata = { title: "ORBITEX Exchange", description: "ORBITEX crypto exchange platform" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover" };

const themeScript = `(() => { try { const saved = localStorage.getItem('orbitex-theme'); const theme = saved === 'light' || saved === 'system' ? saved : 'dark'; document.documentElement.dataset.orbitexTheme = theme; } catch {} })();`;
const enhanceScript = `(() => {
  const enhancePage = () => {
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'auto'; } catch {}
    document.querySelectorAll('.premium-footer .footer-group[open]').forEach((group) => group.removeAttribute('open'));
    const home = document.querySelector('.orbitex-home');
    const footer = document.querySelector('.premium-footer');
    if (home && footer && !home.querySelector('.orbitex-faq-section')) {
      const faq = document.createElement('section'); faq.className = 'orbitex-faq-section'; faq.id = 'faq'; faq.setAttribute('aria-labelledby', 'orbitex-faq-title');
      faq.innerHTML = \`<div class="orbitex-faq-intro"><div class="orbitex-eyebrow">ORBITEX HELP</div><h2 id="orbitex-faq-title">A few things<br><span>worth knowing.</span></h2><p>Quick answers to the questions traders ask most. Everything you need to get started with ORBITEX.</p><a href="#faq-list" class="orbitex-faq-help">Visit the help center <span>→</span></a></div><div class="orbitex-faq-list" id="faq-list">
      <div class="orbitex-faq-item"><button type="button" class="orbitex-faq-question"><span>What is ORBITEX?</span><span class="orbitex-faq-icon">+</span></button><div class="orbitex-faq-answer"><p>ORBITEX is a digital-asset trading platform designed to bring spot and futures markets, market data and wallet tools together in one account.</p></div></div>
      <div class="orbitex-faq-item"><button type="button" class="orbitex-faq-question"><span>How do I create an ORBITEX account?</span><span class="orbitex-faq-icon">+</span></button><div class="orbitex-faq-answer"><p>Select Create account, complete the registration flow and sign in. Once your account is ready, you can access the available trading and wallet features.</p></div></div>
      <div class="orbitex-faq-item"><button type="button" class="orbitex-faq-question"><span>How do I deposit crypto?</span><span class="orbitex-faq-icon">+</span></button><div class="orbitex-faq-answer"><p>Open your wallet, choose Deposit and select the supported asset and network. Always confirm the network and address before sending funds.</p></div></div>
      <div class="orbitex-faq-item"><button type="button" class="orbitex-faq-question"><span>What can I trade on ORBITEX?</span><span class="orbitex-faq-icon">+</span></button><div class="orbitex-faq-answer"><p>ORBITEX supports a growing selection of digital-asset markets across spot and futures. Available pairs and products are shown in the Markets and trading interfaces.</p></div></div>
      <div class="orbitex-faq-item"><button type="button" class="orbitex-faq-question"><span>How do spot and futures trading differ?</span><span class="orbitex-faq-icon">+</span></button><div class="orbitex-faq-answer"><p>Spot trading involves buying or selling an asset directly. Futures trading uses contracts whose value follows an underlying asset and can involve leverage and substantially higher risk.</p></div></div>
      <div class="orbitex-faq-item"><button type="button" class="orbitex-faq-question"><span>What fees does ORBITEX charge?</span><span class="orbitex-faq-icon">+</span></button><div class="orbitex-faq-answer"><p>Trading and other applicable fees are displayed through the platform's fee information. Check the current fee schedule before placing an order.</p></div></div>
      <div class="orbitex-faq-item"><button type="button" class="orbitex-faq-question"><span>How does ORBITEX protect my account?</span><span class="orbitex-faq-icon">+</span></button><div class="orbitex-faq-answer"><p>ORBITEX uses account controls, server-side checks and activity records as part of its security design. Keep your credentials private and enable available account protections.</p></div></div>
      <div class="orbitex-faq-item"><button type="button" class="orbitex-faq-question"><span>Where can I get help?</span><span class="orbitex-faq-icon">+</span></button><div class="orbitex-faq-answer"><p>For account or platform questions, use the support options available on ORBITEX. You can also review the relevant guides and help resources before contacting support.</p></div></div></div>\`;
      footer.parentNode.insertBefore(faq, footer);
      faq.querySelectorAll('.orbitex-faq-question').forEach((button) => button.addEventListener('click', () => { const item = button.parentElement; const wasOpen = item.classList.contains('is-open'); faq.querySelectorAll('.orbitex-faq-item.is-open').forEach((openItem) => openItem.classList.remove('is-open')); if (!wasOpen) item.classList.add('is-open'); faq.querySelectorAll('.orbitex-faq-icon').forEach((icon) => { icon.textContent = icon.closest('.orbitex-faq-item')?.classList.contains('is-open') ? '×' : '+'; }); }));
    }
    const box = document.querySelector('.store-buttons'); if (!box || box.dataset.enhanced === '1') return; box.dataset.enhanced = '1'; box.innerHTML = ''; const play = document.createElement('a'); play.className = 'store-download store-play'; play.href = '/playstore-demo'; play.setAttribute('aria-label', 'Open ORBITEX PlayStore demo'); play.innerHTML = '<span class="store-download-copy"><small>GET IT ON</small><b>PlayStore</b></span><span class="store-download-arrow">›</span>'; const apk = document.createElement('a'); apk.className = 'store-download store-apk'; apk.href = '/apk-demo'; apk.setAttribute('aria-label', 'Open ORBITEX APK demo'); apk.innerHTML = '<span class="store-download-copy"><small>DOWNLOAD</small><b>APK</b></span><span class="store-download-arrow">›</span>'; box.append(play, apk);
  };
  const start = () => { enhancePage(); window.setTimeout(enhancePage, 250); }; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><script dangerouslySetInnerHTML={{ __html: themeScript }} /><ScrollGuard /><AuthGuard />{children}<MobileNav /><AccountMoreMenu /><script dangerouslySetInnerHTML={{ __html: enhanceScript }} /></body></html>; }
