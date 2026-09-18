"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Gift, Zap, ShieldCheck, ChartNoAxesCombined, Globe2, MessageCircle, Send, ChevronDown, Building2, BookOpen, Users, Languages, DollarSign, Moon, Camera, PlayCircle } from "lucide-react";
import CoinIcon from "./components/CoinIcon";
import AuthGateMarketCard from "./components/AuthGateMarketCard";
import LearnKnowledge from "./components/LearnKnowledge";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";

const markets = [["BTC", "Bitcoin", "$77,154.49", "+2.32%"], ["ETH", "Ethereum", "$3,661.27", "+1.48%"], ["SOL", "Solana", "$147.62", "+4.21%"], ["BNB", "BNB", "$712.34", "-3.85%"], ["XRP", "XRP", "$2.91", "+1.92%"], ["DOGE", "Dogecoin", "$0.24", "+3.18%"], ["ADA", "Cardano", "$0.88", "+1.12%"], ["AVAX", "Avalanche", "$24.61", "+2.73%"], ["LINK", "Chainlink", "$18.42", "+3.06%"], ["TRX", "TRON", "$0.34", "+0.64%"], ["DOT", "Polkadot", "$4.21", "-1.08%"], ["LTC", "Litecoin", "$96.31", "+1.55%"], ["BCH", "Bitcoin Cash", "$521.74", "+0.91%"], ["NEAR", "NEAR Protocol", "$3.42", "+2.45%"], ["APT", "Aptos", "$4.81", "+2.11%"], ["ATOM", "Cosmos", "$4.72", "-0.32%"], ["FIL", "Filecoin", "$2.61", "+1.72%"], ["ARB", "Arbitrum", "$0.47", "+3.84%"], ["OP", "Optimism", "$0.58", "+2.04%"], ["SUI", "Sui", "$3.51", "+5.14%"], ["PEPE", "Pepe", "$0.000009", "+4.62%"], ["SHIB", "Shiba Inu", "$0.000013", "+1.26%"], ["ETC", "Ethereum Classic", "$18.72", "-0.76%"], ["UNI", "Uniswap", "$8.21", "+2.88%"], ["AAVE", "Aave", "$312.40", "+3.42%"], ["MATIC", "Polygon", "$0.38", "-1.14%"]] as const;
const features = [[Zap, "Fast Execution", "Professional order tools built for speed"], [ShieldCheck, "Secure & Reliable", "Server-side controls and audit-ready activity"], [ChartNoAxesCombined, "Advanced Trading", "Spot and futures markets in one account"], [Globe2, "Global Access", "Trade anytime across desktop and mobile"]] as const;
const footerGroups = [{ title: "Business", icon: Building2, links: [["About ORBITEX", "/about"], ["Markets", "/markets"], ["Fees", "/fees"], ["API", "/api"]] }, { title: "Learn", icon: BookOpen, links: [["Trading Guide", "/learn"], ["Spot Trading", "/trade"], ["Futures Trading", "/futures"], ["Security", "#security"]] }, { title: "Community", icon: Users, links: [["Telegram", "#"], ["X / Twitter", "#"], ["Instagram", "#"], ["YouTube", "#"] }] as const;

export default function Home() {
  const featured = markets.slice(0, 4);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};
    try {
      const supabase = createSupabaseBrowserClient();
      supabase.auth.getUser().then(({ data }) => { if (mounted) setUserId(data.user?.id ?? null); });
      const subscription = supabase.auth.onAuthStateChange((_event, session) => { if (mounted) setUserId(session?.user?.id ?? null); });
      unsubscribe = () => subscription.data.subscription.unsubscribe();
    } catch { if (mounted) setUserId(null); }
    return () => { mounted = false; unsubscribe(); };
  }, []);

  const accountLabel = userId ? `ID: ${userId.slice(0, 8)}…` : "Log in";
  const tradeHref = userId ? "/trade" : "/login?next=/trade";
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

      <section className="redesign-hero"><div className="hero-orbit-bg" /><div className="hero-copy"><div className="orbitex-eyebrow">THE NEXT GENERATION EXCHANGE</div><h1>TRADE CRYPTO.<br /><span>YOUR WAY.</span></h1><p>Spot &amp; Futures trading from one powerful account. Real-time market data, professional tools and a unified wallet experience.</p><div className="orbitex-hero-buttons"><Link href={tradeHref} className="orbitex-primary">Start Trading <span>→</span></Link><Link href={marketsHref} className="orbitex-secondary">Explore Markets</Link></div><div className="hero-stats"><div><b>20+</b><small>Trading Markets</small></div><div><b>24/7</b><small>Always Available</small></div><div><b>Secure</b><small>Multi-Layer Protection</small></div></div></div><div className="hero-device-wrap"><div className="hero-device-glow" /><div className="hero-orbit-ring ring-a" /><div className="hero-orbit-ring ring-b" /><div className="hero-device"><div className="device-notch" /><div className="device-brand"><img src="/orbitex-logo.svg" alt="" /><b>ORBITEX</b></div><small>Total Balance</small><strong>$6,079.39</strong><em>+2.45% (24h)</em><div className="device-actions"><span><ArrowDownToLine /><small>Deposit</small></span><span><ArrowUpFromLine /><small>Withdraw</small></span><span><ArrowLeftRight /><small>Transfer</small></span><span><Gift /><small>Earn</small></span></div><div className="device-tabs"><b>Favorites</b><b className="active">Hot</b><b>Gainers</b><b>New</b></div>{featured.map(([symbol, name, price, change]) => <div className="device-market" key={symbol}><CoinIcon symbol={symbol} size={29} /><div><b>{symbol}/USDT</b><small>{name}</small></div><div><b>{price}</b><small className={change.startsWith("-") ? "down" : "up"}>{change}</small></div></div>)}</div></div></section>

      <section className="redesign-markets" id="markets"><div className="redesign-section-head"><div><div className="orbitex-eyebrow">LIVE MARKET DATA</div><h2>Markets</h2></div><Link href={marketsHref}>View all →</Link></div><div className="market-cards">{featured.map(([symbol, name, price, change]) => <AuthGateMarketCard symbol={symbol} name={name} price={price} change={change} key={symbol} />)}</div></section>

      <section className="redesign-feature-section" id="features"><div className="feature-copy"><div className="orbitex-eyebrow">BUILT FOR TRADERS</div><h2>A Smarter Way<br />to <span>Trade.</span></h2><p>Powerful tools, deep market data and a seamless trading experience. ORBITEX gives you everything you need to trade with confidence.</p><Link href={userId ? "/dashboard" : "/signup"} className="orbitex-primary">Create Your Account →</Link></div><div className="redesign-feature-grid">{features.map(([Icon, title, text]) => <article key={title}><b className="feature-icon"><Icon aria-hidden="true" /></b><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <section className="redesign-anywhere reference-showcase"><div className="reference-copy"><div className="orbitex-eyebrow">TRADE ANYTIME, ANYWHERE</div><h2>One account.<br /><span>Every market.</span></h2><p>Move between spot, futures and your wallet from a single clean interface built for desktop and mobile.</p></div><div className="reference-stage"><div className="reference-glow" /><div className="reference-card ref-eth"><CoinIcon symbol="ETH" size={40} /><b>ETH/USDT</b><strong>$3,248.21</strong><em>↗ +4.12%</em></div><div className="reference-card ref-sol"><CoinIcon symbol="SOL" size={40} /><b>SOL/USDT</b><strong>$189.32</strong><em>↗ +6.21%</em></div><div className="reference-card ref-usdt"><CoinIcon symbol="USDT" size={40} /><b>USDT</b><strong>$1.00</strong><em>— 0.00%</em></div><div className="reference-card ref-portfolio"><b>Your Portfolio</b><strong>$12,482.50</strong><em>↗ +5.21% (24h)</em></div><div className="reference-coin ref-btc"><CoinIcon symbol="BTC" size={56} /></div><div className="reference-phone"><div className="reference-phone-notch" /><div className="reference-phone-brand"><img src="/orbitex-logo.svg" alt="" /><b>ORBITEX</b></div><div className="reference-phone-tabs"><b>Spot</b><span>Futures</span><span>Wallet</span><span>Earn</span></div><div className="reference-pair"><span>BTC/USDT</span><strong>77,154.49</strong><em>↗ +2.32% (+1,745.21)</em></div><div className="reference-chart"><i /><i /><i /><i /><i /><i /><i /></div><div className="reference-time"><span>1D</span><b>1W</b><span>1M</span><span>3M</span><span>1Y</span></div><div className="reference-phone-stats"><span>24h High<strong>77,540.12</strong></span><span>24h Low<strong>74,320.18</strong></span><span>24h Volume<strong>1.24B USDT</strong></span></div><div className="reference-buy"><b>Buy</b><b>Sell</b></div><div className="reference-nav"><span>⌂<small>Home</small></span><span>▥<small>Markets</small></span><span>◎<small>Trade</small></span><span>▤<small>Futures</small></span><span>▣<small>Assets</small></span></div></div><div className="reference-coin ref-sol-coin"><CoinIcon symbol="SOL" size={62} /></div></div></section>

      <LearnKnowledge />

      <section className="orbitex-security redesign-security" id="security"><div><div className="orbitex-eyebrow">SECURITY FIRST</div><h2>Built with control at every layer.</h2><p>Account balances, trading activity and privileged wallet operations are designed around server-side controls, audit trails and risk management.</p></div></section>

      <footer className="orbitex-footer redesign-footer orbitex-example-footer">
        <style jsx global>{`
          .orbitex-example-footer{max-width:100%;margin:0;background:#0d1117;color:#f4f7fb;padding:72px clamp(48px,6vw,92px) 30px;border-top:1px solid #202b39}
          .orbitex-example-footer .example-footer-top{display:flex;align-items:center;gap:34px;margin-bottom:64px}
          .orbitex-example-footer .example-footer-brand{display:inline-flex;align-items:center;gap:12px;text-decoration:none;flex:0 0 auto}
          .orbitex-example-footer .example-footer-brand img{width:52px;height:52px;object-fit:contain}
          .orbitex-example-footer .example-footer-brand b{font-size:30px;letter-spacing:-.8px;color:#fff}
          .orbitex-example-footer .example-footer-line{height:1px;background:#28313d;flex:1}
          .orbitex-example-footer .example-footer-mark{width:54px;height:54px;border-radius:50%;background:#f5f6f8;display:grid;place-items:center;flex:0 0 auto;color:#111}
          .orbitex-example-footer .example-footer-mark svg{width:28px;height:28px}
          .orbitex-example-footer .example-footer-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:48px;padding-bottom:76px}
          .orbitex-example-footer .example-footer-col h3{font-size:18px;margin:0 0 28px;color:#fff;font-weight:700}
          .orbitex-example-footer .example-footer-col a{display:block;text-decoration:none;color:#8e9bad;font-size:16px;margin:0 0 22px;transition:color .15s ease}
          .orbitex-example-footer .example-footer-col a:hover{color:#fff}
          .orbitex-example-footer .example-footer-bottom{border-top:1px solid #202a37;padding-top:24px;display:flex;justify-content:space-between;align-items:center;gap:24px;color:#718096;font-size:12px}
          .orbitex-example-footer .example-footer-legal{display:flex;gap:26px;flex-wrap:wrap}
          .orbitex-example-footer .example-footer-legal a{color:#718096;text-decoration:none}
          .orbitex-example-footer .example-footer-legal a:hover{color:#fff}
          @media(max-width:900px){.orbitex-example-footer{padding:56px 28px 26px}.orbitex-example-footer .example-footer-grid{grid-template-columns:repeat(2,1fr);gap:40px}.orbitex-example-footer .example-footer-top{margin-bottom:48px}}
          @media(max-width:560px){.orbitex-example-footer .example-footer-top{gap:14px}.orbitex-example-footer .example-footer-brand img{width:40px;height:40px}.orbitex-example-footer .example-footer-brand b{font-size:24px}.orbitex-example-footer .example-footer-mark{width:44px;height:44px}.orbitex-example-footer .example-footer-grid{grid-template-columns:1fr;gap:30px;padding-bottom:45px}.orbitex-example-footer .example-footer-col h3{margin-bottom:18px}.orbitex-example-footer .example-footer-col a{margin-bottom:14px}.orbitex-example-footer .example-footer-bottom{align-items:flex-start;flex-direction:column}}
        `}</style>
        <div className="example-footer-top">
          <Link href="/" className="example-footer-brand"><img src="/orbitex-logo.svg" alt="ORBITEX" /><b>ORBITEX</b></Link>
          <div className="example-footer-line" />
          <div className="example-footer-mark" aria-hidden="true"><MessageCircle /></div>
        </div>
        <div className="example-footer-grid">
          <div className="example-footer-col"><h3>About Us</h3><Link href="/fees">Fees</Link><Link href="/network-status">Network Status</Link><Link href="/cookie-policy">Cookie Policy</Link></div>
          <div className="example-footer-col"><h3>Products</h3><Link href="/markets">Markets</Link><Link href="/trade">Spot</Link><Link href="/swap">Swap</Link><Link href="/lending">Crypto Lending</Link><Link href="/referral">Referral Program</Link></div>
          <div className="example-footer-col"><h3>Tools</h3><Link href="/cross-rates">Cross Rates</Link><Link href="/heat-map">Heat Map</Link><Link href="/market-cap">Market Cap</Link><Link href="/market-screener">Market Screener</Link><Link href="/technical-analysis">Technical Analysis</Link></div>
          <div className="example-footer-col"><h3>Legal &amp; Disclosures</h3><Link href="/user-agreement">User Agreement</Link><Link href="/privacy">Privacy Policy</Link><Link href="/compliance">Compliance</Link></div>
        </div>
        <div className="example-footer-bottom"><span>© 2026 ORBITEX</span><div className="example-footer-legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/cookie-policy">Cookie Preferences</Link></div></div>
      </footer>
    </main>
  );
}
