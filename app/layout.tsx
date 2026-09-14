import type { Metadata } from "next";
import "./globals.css";
import "./global-theme.css";
import "./orbitex.css";
import "./orbitex-internal.css";
import "./logo-overrides.css";
import "./home-redesign.css";
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
import MobileNav from "./components/MobileNav";
import ScrollGuard from "./components/ScrollGuard";

export const metadata: Metadata = { title: "ORBITEX Exchange", description: "ORBITEX crypto exchange platform" };

const themeScript = `(() => { try { const saved = localStorage.getItem('orbitex-theme'); const theme = saved === 'light' || saved === 'system' ? saved : 'dark'; document.documentElement.dataset.orbitexTheme = theme; } catch {} })();`;

const futuresPriceScript = `(() => {
  let socket = null;
  let activeSymbol = '';
  let observer = null;
  const format = value => {
    if (!Number.isFinite(value)) return '';
    const digits = value >= 1000 ? 2 : value >= 1 ? 4 : 8;
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: digits }).format(value);
  };
  const getSymbol = () => {
    const pair = document.querySelector('.futures-wrap .trade-head .pair');
    const text = pair?.textContent || '';
    const match = text.match(/[A-Z0-9]+\\s*\\/\\s*USDT/i);
    return match ? match[0].replace(/\\s/g, '').replace('/', '').toLowerCase() : '';
  };
  const render = value => {
    const price = document.querySelector('.futures-wrap .trade-head .price');
    if (!price || !Number.isFinite(value)) return;
    let live = price.querySelector('.up');
    if (!live) {
      live = document.createElement('span');
      live.className = 'up';
      live.textContent = 'LIVE';
      price.replaceChildren(document.createTextNode(format(value) + ' '), live);
      return;
    }
    const nodes = Array.from(price.childNodes).filter(node => node !== live);
    nodes.forEach(node => node.remove());
    price.insertBefore(document.createTextNode(format(value) + ' '), live);
  };
  const connect = () => {
    const symbol = getSymbol();
    if (!symbol || symbol === activeSymbol) return;
    activeSymbol = symbol;
    if (socket) { try { socket.close(); } catch {} }
    socket = null;
    fetch('https://fapi.binance.com/fapi/v1/ticker/price?symbol=' + symbol)
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (activeSymbol === symbol) render(Number(data?.price)); })
      .catch(() => {});
    try {
      socket = new WebSocket('wss://fstream.binance.com/market/stream?streams=' + symbol + '@markPrice@1s');
      socket.onmessage = event => {
        try {
          const payload = JSON.parse(event.data);
          const data = payload.data || payload;
          const value = Number(data.p);
          if (data.s?.toLowerCase() === symbol && Number.isFinite(value)) render(value);
        } catch {}
      };
      socket.onerror = () => { try { socket.close(); } catch {} };
    } catch {}
  };
  const start = () => {
    connect();
    if (!observer) {
      observer = new MutationObserver(connect);
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><script dangerouslySetInnerHTML={{ __html: themeScript }} /><ScrollGuard />{children}<MobileNav/><script dangerouslySetInnerHTML={{__html:`(() => { const enhancePage=()=>{ try{if('scrollRestoration' in history)history.scrollRestoration='auto'}catch{} document.querySelectorAll('.premium-footer .footer-group[open]').forEach(g=>g.removeAttribute('open')); const box=document.querySelector('.store-buttons'); if(!box||box.dataset.enhanced==='1')return; box.dataset.enhanced='1'; box.innerHTML=''; const play=document.createElement('a'); play.className='store-download store-play'; play.href='/playstore-demo'; play.setAttribute('aria-label','Open ORBITEX PlayStore demo'); play.innerHTML='<svg class="store-download-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#34A853" d="M2 3.5v17l9.5-8.5z"/><path fill="#FBBC04" d="m2 3.5 12 7-2.5 2.5z"/><path fill="#EA4335" d="m2 20.5 9.5-8.5 2.5 2.5z"/><path fill="#4285F4" d="m11.5 12 2.5-2.5 4.2 2.45c.53.31.53 1.08 0 1.39L14 15.8z"/></svg><span class="store-download-copy"><small>GET IT ON</small><b>PlayStore</b></span><span class="store-download-arrow">›</span>'; const apk=document.createElement('a'); apk.className='store-download store-apk'; apk.href='/apk-demo'; apk.setAttribute('aria-label','Open ORBITEX APK demo'); apk.innerHTML='<svg class="store-download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v11"/><path d="m7 9 5 5 5-5"/><path d="M5 21h14"/><path d="M5 17v4"/><path d="M19 17v4"/></svg><span class="store-download-copy"><small>DOWNLOAD</small><b>APK</b></span><span class="store-download-arrow">›</span>'; box.append(play,apk); }; const tryEnhance=()=>{enhancePage(); if(!document.querySelector('.premium-footer .footer-group[open]'))return; setTimeout(tryEnhance,150)}; if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tryEnhance,{once:true}); else tryEnhance(); })();`}}/><script dangerouslySetInnerHTML={{ __html: futuresPriceScript }} /></body></html>;
}
