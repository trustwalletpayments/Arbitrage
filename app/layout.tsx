import type { Metadata } from "next";
import "./globals.css";
import "./orbitex.css";
import "./orbitex-internal.css";
import "./logo-overrides.css";
import "./home-redesign.css";
import "./store-badge-overrides.css";
import "./footer-redesign.css";
import "./footer-binance.css";
import "./download-buttons.css";
import "./security-icon.css";

export const metadata: Metadata = { title: "ORBITEX Exchange", description: "ORBITEX crypto exchange platform" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<script dangerouslySetInnerHTML={{__html:`(() => { const enhancePage=()=>{ try{if('scrollRestoration' in history)history.scrollRestoration='manual';window.scrollTo(0,0)}catch{} document.querySelectorAll('.premium-footer .footer-group[open]').forEach(g=>g.removeAttribute('open')); const box=document.querySelector('.store-buttons'); if(!box||box.dataset.enhanced==='1')return; box.dataset.enhanced='1'; box.innerHTML=''; const play=document.createElement('a'); play.className='store-download store-play'; play.href='/playstore-demo'; play.setAttribute('aria-label','Open ORBITEX PlayStore demo'); play.innerHTML='<svg class="store-download-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#34A853" d="M2 3.5v17l9.5-8.5z"/><path fill="#FBBC04" d="m2 3.5 12 7-2.5 2.5z"/><path fill="#EA4335" d="m2 20.5 9.5-8.5 2.5 2.5z"/><path fill="#4285F4" d="m11.5 12 2.5-2.5 4.2 2.45c.53.31.53 1.08 0 1.39L14 15.8z"/></svg><span class="store-download-copy"><small>GET IT ON</small><b>PlayStore</b></span><span class="store-download-arrow">›</span>'; const apk=document.createElement('a'); apk.className='store-download store-apk'; apk.href='/apk-demo'; apk.setAttribute('aria-label','Open ORBITEX APK demo'); apk.innerHTML='<svg class="store-download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v11"/><path d="m7 9 5 5 5-5"/><path d="M5 21h14"/><path d="M5 17v4"/><path d="M19 17v4"/></svg><span class="store-download-copy"><small>DOWNLOAD</small><b>APK</b></span><span class="store-download-arrow">›</span>'; box.append(play,apk); }; const tryEnhance=()=>{enhancePage(); if(!document.querySelector('.premium-footer .footer-group[open]'))return; setTimeout(tryEnhance,150)}; if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tryEnhance,{once:true}); else tryEnhance(); })();`}}/></body></html>;
}
