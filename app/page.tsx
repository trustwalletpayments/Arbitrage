"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Gift, Zap, ShieldCheck,
  ChartNoAxesCombined, Globe2, MessageCircle, Send, ChevronDown, Building2,
  BookOpen, Users, Languages, DollarSign, Moon, Camera, PlayCircle,
} from "lucide-react";
import CoinIcon from "./components/CoinIcon";
import AuthGateMarketCard from "./components/AuthGateMarketCard";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";

const markets = [
  ["BTC", "Bitcoin", "$77,154.49", "+2.32%"], ["ETH", "Ethereum", "$3,661.27", "+1.48%"], ["SOL", "Solana", "$147.62", "+4.21%"], ["BNB", "BNB", "$712.34", "-3.85%"], ["XRP", "XRP", "$2.91", "+1.92%"], ["DOGE", "Dogecoin", "$0.24", "+3.18%"], ["ADA", "Cardano", "$0.88", "+1.12%"], ["AVAX", "Avalanche", "$24.61", "+2.73%"], ["LINK", "Chainlink", "$18.42", "+3.06%"], ["TRX", "TRON", "$0.34", "+0.64%"], ["DOT", "Polkadot", "$4.21", "-1.08%"], ["LTC", "Litecoin", "$96.31", "+1.55%"], ["BCH", "Bitcoin Cash", "$521.74", "+0.91%"], ["NEAR", "NEAR Protocol", "$3.42", "+2.45%"], ["APT", "Aptos", "$4.81", "+2.11%"], ["ATOM", "Cosmos", "$4.72", "-0.32%"], ["FIL", "Filecoin", "$2.61", "+1.72%"], ["ARB", "Arbitrum", "$0.47", "+3.84%"], ["OP", "Optimism", "$0.58", "+2.04%"], ["SUI", "Sui", "$3.51", "+5.14%"], ["PEPE", "Pepe", "$0.000009", "+4.62%"], ["SHIB", "Shiba Inu", "$0.000013", "+1.26%"], ["ETC", "Ethereum Classic", "$18.72", "-0.76%"], ["UNI", "Uniswap", "$8.21", "+2.88%"], ["AAVE", "Aave", "$312.40", "+3.42%"], ["MATIC", "Polygon", "$0.38", "-1.14%"],
] as const;

const features = [
  [Zap, "Fast Execution", "Professional order tools built for speed"], [ShieldCheck, "Secure & Reliable", "Server-side controls and audit-ready activity"], [ChartNoAxesCombined, "Advanced Trading", "Spot and futures markets in one account"], [Globe2, "Global Access", "Trade anytime across desktop and mobile"],
] as const;

const footerGroups = [
  { title: "Business", icon: Building2, links: [["About ORBITEX", "/about"], ["Markets", "/markets"], ["Fees", "/fees"], ["API", "/api"]] },
  { title: "Learn", icon: BookOpen, links: [["Trading Guide", "/learn"], ["Spot Trading", "/trade"], ["Futures Trading", "/futures"], ["Security", "#security"]] },
  { title: "Community", icon: Users, links: [["Telegram", "#"], ["X / Twitter", "#"], ["Instagram", "#"], ["YouTube", "#"]] },
] as const;

export default function Home() {
  const featured = markets.slice(0, 4);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};
    try {
      const supabase = createSupabaseBrowserClient();
      supabase.auth.getUser().then(({ data }) => {
        if (mounted) setUserId(data.user?.id ?? null);
      });
      const subscription = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) setUserId(session?.user?.id ?? null);
      });
      unsubscribe = () => subscription.data.subscription.unsubscribe();
    } catch {
      if (mounted) setUserId(null);
    }
    return () => { mounted = false; unsubscribe(); };
  }, []);

  const accountLabel = userId ? `ID: ${userId.slice(0, 8)}…` : "Log in";
  const marketsHref = userId ? "/markets" : "/login?next=/markets";

  return (
    <main className="orbitex-home redesign-home">
      <header className="orbitex-header redesign-header">
        <Link href="/" className="orbitex-logo brand-logo"><img src="/orbitex-logo.svg" alt="ORBITEX" /><span>ORBITEX</span></Link>
        <nav className="orbitex-nav"><a href="#markets">Markets</a><a href="#features">Features</a><a href="/trade">Spot</a><a href="/futures">Futures</a><a href="#security">Security</a></nav>
        <div className="orbitex-actions">
          {userId ? <Link className="orbitex-login logged-in-account" href="/dashboard" title={`User ID: ${userId}`}>{accountLabel}</Link> : <Link className="orbitex-login" href="/login">Log in</Link>}
          {userId ? <Link className="orbitex-create" href="/dashboard">Dashboard</Link> : <Link className="orbitex-create" href="/signup">Create account</Link>}
          <button className="orbitex-menu" aria-label="Menu">☰</button>
        </div>
      </header>

      <section className="redesign-hero"><div className="hero-orbit-bg" /><div className="hero-copy"><div className="orbitex-eyebrow">THE NEXT GENERATION EXCHANGE</div><h1>TRADE CRYPTO.<br /><span>YOUR WAY.</span></h1><p>Spot &amp; Futures trading from one powerful account. Real-time market data, professional tools and a unified wallet experience.</p><div className="orbitex-hero-buttons"><Link href="/signup" className="orbitex-primary">Start Trading <span>→</span></Link><Link href="#markets" className="orbitex-secondary">Explore Markets</Link></div><div className="hero-stats"><div><b>20+</b><small>Trading Markets</small></div><div><b>24/7</b><small>Always Available</small></div><div><b>Secure</b><small>Multi-Layer Protection</small></div></div></div>
        <div className="hero-device-wrap"><div className="hero-device-glow" /><div className="hero-orbit-ring ring-a" /><div className="hero-orbit-ring ring-b" /><div className="hero-device"><div className="device-notch" /><div className="device-brand"><img src="/orbitex-logo.svg" alt="" /><b>ORBITEX</b></div><small>Total Balance</small><strong>$6,079.39</strong><em>+2.45% (24h)</em><div className="device-actions"><span><ArrowDownToLine /><small>Deposit</small></span><span><ArrowUpFromLine /><small>Withdraw</small></span><span><ArrowLeftRight /><small>Transfer</small></span><span><Gift /><small>Earn</small></span></div><div className="device-tabs"><b>Favorites</b><b className="active">Hot</b><b>Gainers</b><b>New</b></div>{featured.map(([symbol, name, price, change]) => <div className="device-market" key={symbol}><CoinIcon symbol={symbol} size={29} /><div><b>{symbol}/USDT</b><small>{name}</small></div><div><b>{price}</b><small className={change.startsWith("-") ? "down" : "up"}>{change}</small></div></div>)}</div></div>
      </section>

      <section className="redesign-markets" id="markets"><div className="redesign-section-head"><div><div className="orbitex-eyebrow">LIVE MARKET DATA</div><h2>Markets</h2></div><Link href={marketsHref}>View all →</Link></div><div className="market-cards">{featured.map(([symbol, name, price, change]) => <AuthGateMarketCard symbol={symbol} name={name} price={price} change={change} key={symbol} />)}</div></section>

      <section className="redesign-feature-section" id="features"><div className="feature-copy"><div className="orbitex-eyebrow">BUILT FOR TRADERS</div><h2>A Smarter Way<br />to <span>Trade.</span></h2><p>Powerful tools, deep market data and a seamless trading experience. ORBITEX gives you everything you need to trade with confidence.</p><Link href="/signup" className="orbitex-primary">Create Your Account →</Link></div><div className="redesign-feature-grid">{features.map(([Icon, title, text]) => <article key={title}><b className="feature-icon"><Icon aria-hidden="true" /></b><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <section className="redesign-anywhere reference-showcase"><div className="reference-copy"><div className="orbitex-eyebrow">TRADE ANYTIME, ANYWHERE</div><h2>One account.<br /><span>Every market.</span></h2><p>Move between spot, futures and your wallet from a single clean interface built for desktop and mobile.</p><div className="store-buttons"><span className="store-badge"><svg className="store-icon play" viewBox="0 0 24 24" aria-hidden="true"><path fill="#34A853" d="M2 3.5v17l9.5-8.5z" /><path fill="#FBBC04" d="m2 3.5 12 7-2.5 2.5z" /><path fill="#EA4335" d="m2 20.5 9.5-8.5 2.5 2.5z" /><path fill="#4285F4" d="m11.5 12 2.5-2.5 4.2 2.45c.53.31.53 1.08 0 1.39L14 15.8z" /></svg><span><small>GET IT ON</small><b>Google Play</b></span></span></div></div>
        <div className="reference-stage"><div className="reference-glow" /><div className="reference-card ref-eth"><CoinIcon symbol="ETH" size={40} /><b>ETH/USDT</b><strong>$3,248.21</strong><em>↗ +4.12%</em></div><div className="reference-card ref-sol"><CoinIcon symbol="SOL" size={40} /><b>SOL/USDT</b><strong>$189.32</strong><em>↗ +6.21%</em></div><div className="reference-card ref-usdt"><CoinIcon symbol="USDT" size={40} /><b>USDT</b><strong>$1.00</strong><em>— 0.00%</em></div><div className="reference-card ref-portfolio"><b>Your Portfolio</b><strong>$12,482.50</strong><em>↗ +5.21% (24h)</em></div><div className="reference-coin ref-btc"><CoinIcon symbol="BTC" size={56} /></div><div className="reference-phone"><div className="reference-phone-notch" /><div className="reference-phone-brand"><img src="/orbitex-logo.svg" alt="" /><b>ORBITEX</b></div><div className="reference-phone-tabs"><b>Spot</b><span>Futures</span><span>Wallet</span><span>Earn</span></div><div className="reference-pair"><span>BTC/USDT</span><strong>77,154.49</strong><em>↗ +2.32% (+1,745.21)</em></div><div className="reference-chart"><i /><i /><i /><i /><i /><i /><i /></div><div className="reference-time"><span>1D</span><b>1W</b><span>1M</span><span>3M</span><span>1Y</span></div><div className="reference-phone-stats"><span>24h High<strong>77,540.12</strong></span><span>24h Low<strong>74,320.18</strong></span><span>24h Volume<strong>1.24B USDT</strong></span></div><div className="reference-buy"><b>Buy</b><b>Sell</b></div><div className="reference-nav"><span>⌂<small>Home</small></span><span>▥<small>Markets</small></span><span>◎<small>Trade</small></span><span>▤<small>Futures</small></span><span>▣<small>Assets</small></span></div></div><div className="reference-coin ref-sol-coin"><CoinIcon symbol="SOL" size={62} /></div></div>
      </section>

      <section className="orbitex-security redesign-security" id="security"><div><div className="orbitex-eyebrow">SECURITY FIRST</div><h2>Built with control at every layer.</h2><p>Account balances, trading activity and privileged wallet operations are designed around server-side controls, audit trails and risk management.</p></div></section>

      <footer className="orbitex-footer redesign-footer premium-footer"><div className="footer-main"><div className="footer-brand-block"><Link href="/" className="footer-brand"><img src="/orbitex-logo.svg" alt="ORBITEX" /><b>ORBITEX</b></Link><p>Trade Crypto. Without Limits.</p><div className="footer-socials"><a href="#" aria-label="Telegram"><Send /></a><a href="#" aria-label="X"><Globe2 /></a><a href="#" aria-label="Instagram"><Camera /></a><a href="#" aria-label="YouTube"><PlayCircle /></a><a href="#" aria-label="Community"><MessageCircle /></a><a href="#" aria-label="Community members"><Users /></a></div></div><div className="footer-links">{footerGroups.map(({ title, icon: Icon, links }) => <details key={title} className="footer-group"><summary><span><Icon /> {title}</span><ChevronDown /></summary><div>{links.map(([label, href]) => <a href={href} key={label}>{label}</a>)}</div></details>)}</div></div><div className="footer-preferences"><button><Languages /> English (India)<ChevronDown /></button><button><DollarSign /> USD<ChevronDown /></button><button><Moon /> Theme <span className="theme-switch"><i /></span></button></div><div className="footer-legal"><p>Risk Warning: Digital asset prices can be volatile. The value of your assets can go up or down, and you may lose some or all of your investment. Trade only with funds you can afford to lose.</p><div><span>© 2026 ORBITEX</span><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Cookie Preferences</a></div></div></footer>
    </main>
  );
}
