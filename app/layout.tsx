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
const chartScript = `(() => {
  const boot = () => {
    if (location.pathname !== '/futures' || document.querySelector('[data-orbitex-candles]')) return;
    const host = document.querySelector('.futures-chart-area .chart');
    if (!host) return;
    host.dataset.orbitexCandles = '1';
    host.innerHTML = '<div class="orbitex-chart-toolbar"><div class="orbitex-chart-title">Price Chart <span>LIVE</span></div><div class="orbitex-timeframes">${['1m','5m','15m','30m','1h','4h','1d'].map(t => `<button data-tf="${t}" class="${t === '1m' ? 'active' : ''}">${t}</button>`).join('')}</div></div><canvas class="orbitex-candle-canvas"></canvas><div class="orbitex-chart-status">Loading market data…</div>';
    const canvas = host.querySelector('canvas'); const ctx = canvas.getContext('2d'); const status = host.querySelector('.orbitex-chart-status'); let tf = '1m'; let candles = []; let socket;
    const resize = () => { const r = host.getBoundingClientRect(); const d = devicePixelRatio || 1; canvas.width = Math.max(1, r.width * d); canvas.height = Math.max(1, (r.height - 58) * d); canvas.style.width = r.width + 'px'; canvas.style.height = Math.max(1, r.height - 58) + 'px'; ctx.setTransform(d,0,0,d,0,0); draw(); };
    const draw = () => { if (!ctx) return; const w = canvas.clientWidth, h = canvas.clientHeight; ctx.clearRect(0,0,w,h); if (!candles.length) return; const pad={l:8,r:58,t:12,b:22}; const values=candles.flatMap(c=>[c.high,c.low]); let min=Math.min(...values), max=Math.max(...values); const extra=(max-min)*.08 || max*.01 || 1; min-=extra; max+=extra; const xStep=(w-pad.l-pad.r)/Math.max(1,candles.length); const y=v=>pad.t+(max-v)/(max-min)*(h-pad.t-pad.b); ctx.font='11px Arial'; ctx.textAlign='right'; ctx.fillStyle='rgba(170,184,205,.7)'; for(let i=0;i<5;i++){const v=min+(max-min)*i/4, yy=y(v);ctx.strokeStyle='rgba(255,255,255,.07)';ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();ctx.fillText(v.toFixed(v<1?6:2),w-6,yy+4)} candles.forEach((c,i)=>{const x=pad.l+i*xStep+xStep/2, up=c.close>=c.open, top=y(Math.max(c.open,c.close)), bottom=y(Math.min(c.open,c.close));ctx.strokeStyle=up?'#20c997':'#ff5c75';ctx.fillStyle=up?'#20c997':'#ff5c75';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y(c.high));ctx.lineTo(x,y(c.low));ctx.stroke();ctx.fillRect(x-Math.max(1,xStep*.32),top,Math.max(2,xStep*.64),Math.max(1,bottom-top));}); const last=candles[candles.length-1]; ctx.fillStyle=last.close>=last.open?'#20c997':'#ff5c75';ctx.fillRect(w-pad.r,y(last.close)-.5,pad.r-8,1);ctx.textAlign='left';ctx.fillText(last.close.toFixed(last.close<1?6:2),w-pad.r+5,y(last.close)+4); };
    const load = async () => { if(socket) socket.close(); candles=[]; draw(); status.textContent='Loading '+tf+' candles…'; try { const s=(document.querySelector('.pair')?.textContent||'BTC/USDT').split('/')[0].replace(/[^A-Z0-9]/g,''); const symbol=(s||'BTC')+'USDT'; const data=await fetch('https://fapi.binance.com/fapi/v1/klines?symbol='+symbol+'&interval='+tf+'&limit=100').then(r=>r.json()); candles=data.map(k=>({time:k[0],open:+k[1],high:+k[2],low:+k[3],close:+k[4]})); status.textContent=symbol+' · '+tf+' · Live'; draw(); socket=new WebSocket('wss://fstream.binance.com/ws/'+symbol.toLowerCase()+'@kline_'+tf); socket.onmessage=e=>{const k=JSON.parse(e.data).k; if(!k)return; const next={time:k.t,open:+k.o,high:+k.h,low:+k.l,close:+k.c}; const last=candles[candles.length-1]; if(last&&last.time===next.time)candles[candles.length-1]=next; else candles.push(next); candles=candles.slice(-100); draw();}; } catch { status.textContent='Unable to load chart data'; } };
    host.querySelectorAll('[data-tf]').forEach(b=>b.addEventListener('click',()=>{host.querySelectorAll('[data-tf]').forEach(x=>x.classList.remove('active'));b.classList.add('active');tf=b.dataset.tf;load();})); new ResizeObserver(resize).observe(host); resize(); load();
  }; setTimeout(boot,250); new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><script dangerouslySetInnerHTML={{ __html: themeScript }} /><ScrollGuard />{children}<MobileNav/><script dangerouslySetInnerHTML={{__html:`(() => { const enhancePage=()=>{ try{if('scrollRestoration' in history)history.scrollRestoration='auto'}catch{} document.querySelectorAll('.premium-footer .footer-group[open]').forEach(g=>g.removeAttribute('open')); const box=document.querySelector('.store-buttons'); if(!box||box.dataset.enhanced==='1')return; box.dataset.enhanced='1'; box.innerHTML=''; const play=document.createElement('a'); play.className='store-download store-play'; play.href='/playstore-demo'; play.setAttribute('aria-label','Open ORBITEX PlayStore demo'); play.innerHTML='<svg class="store-download-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#34A853" d="M2 3.5v17l9.5-8.5z"/><path fill="#FBBC04" d="m2 3.5 12 7-2.5 2.5z"/><path fill="#EA4335" d="m2 20.5 9.5-8.5 2.5 2.5z"/><path fill="#4285F4" d="m11.5 12 2.5-2.5 4.2 2.45c.53.31.53 1.08 0 1.39L14 15.8z"/></svg><span class="store-download-copy"><small>GET IT ON</small><b>PlayStore</b></span><span class="store-download-arrow">›</span>'; const apk=document.createElement('a'); apk.className='store-download store-apk'; apk.href='/apk-demo'; apk.setAttribute('aria-label','Open ORBITEX APK demo'); apk.innerHTML='<svg class="store-download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v11"/><path d="m7 9 5 5 5-5"/><path d="M5 21h14"/><path d="M5 17v4"/><path d="M19 17v4"/></svg><span class="store-download-copy"><small>DOWNLOAD</small><b>APK</b></span><span class="store-download-arrow">›</span>'; box.append(play,apk); }; const tryEnhance=()=>{enhancePage(); if(!document.querySelector('.premium-footer .footer-group[open]'))return; setTimeout(tryEnhance,150)}; if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tryEnhance,{once:true}); else tryEnhance(); })();`}}/><script dangerouslySetInnerHTML={{__html:chartScript}}/></body></html>;
}
