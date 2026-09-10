import Link from "next/link";

const markets = [
  ["BTC", "$77,154.49", "+2.32%"],
  ["ETH", "$3,661.27", "+1.48%"],
  ["BNB", "$712.34", "-3.85%"],
  ["SOL", "$147.62", "+4.21%"],
];

const features = [
  ["⚡", "Low fees", "More trading, more opportunity"],
  ["◈", "Secure", "Your assets, our priority"],
  ["◎", "Global access", "Trade anywhere, anytime"],
  ["▥", "Advanced tools", "For beginners and professionals"],
];

export default function Home() {
  return (
    <main className="orbitex-home">
      <header className="orbitex-header">
        <Link href="/" className="orbitex-logo"><span className="orbit-mark">◉</span>ORBIT<span>EX</span></Link>
        <nav className="orbitex-nav"><a href="#markets">Markets</a><a href="#features">Features</a><a href="#security">Security</a><a href="/trade">Trade</a></nav>
        <div className="orbitex-actions"><Link className="orbitex-login" href="/login">Log in</Link><Link className="orbitex-create" href="/signup">Create account</Link><button className="orbitex-menu" aria-label="Menu">☰</button></div>
      </header>

      <section className="orbitex-hero">
        <div className="orbit-glow orbit-glow-one" /><div className="orbit-glow orbit-glow-two" />
        <div className="orbitex-hero-copy">
          <div className="orbitex-eyebrow">TRADE WITHOUT LIMITS</div>
          <h1>A TRADING<br/>PLATFORM<br/>BUILT FOR <strong>CONTROL.</strong></h1>
          <p>Trade spot and futures markets from one account. Real-time market data, professional order tools and a unified wallet experience.</p>
          <div className="orbitex-hero-buttons"><Link href="/signup" className="orbitex-primary">Start trading <span>→</span></Link><Link href="#markets" className="orbitex-secondary">Explore markets</Link></div>
        </div>
        <div className="orbit-phone-wrap" aria-hidden="true">
          <div className="orbit-planet" />
          <div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" />
          <div className="orbit-phone">
            <div className="phone-notch" />
            <div className="phone-brand"><span className="orbit-mini-mark">◉</span> ORBITEX</div>
            <div className="phone-label">Total Balance</div><div className="phone-balance">$6,079.39</div><div className="phone-gain">+2.45% (24h)</div>
            <div className="phone-actions"><span>↓<small>Deposit</small></span><span>↑<small>Withdraw</small></span><span>⇄<small>Transfer</small></span><span>▣<small>Earn</small></span></div>
            <div className="phone-tabs"><b>Favorites</b><b>Hot</b><b>Gainers</b><b>New</b></div>
            {markets.map(([name,price,change])=><div className="phone-market" key={name}><i>{name[0]}</i><div><b>{name}</b><small>{name === "BTC" ? "Bitcoin" : name}</small></div><div><b>{price}</b><small className={change.startsWith("-") ? "phone-red" : "phone-green"}>{change}</small></div></div>)}
          </div>
        </div>
      </section>

      <section className="orbitex-features" id="features">{features.map(([icon,title,text])=><article key={title}><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>)}</section>

      <section className="orbitex-ticker" id="markets">{markets.map(([name,price,change])=><Link href="/trade" key={name}><span className="ticker-icon">{name[0]}</span><div><b>{name}</b><strong>{price}</strong><em className={change.startsWith("-") ? "phone-red" : "phone-green"}>{change}</em></div></Link>)}</section>

      <section className="orbitex-anywhere"><div><div className="orbitex-eyebrow">TRADE ANYTIME, ANYWHERE</div><h2>Powerful. Fast.<br/><span>Secure.</span></h2><p>The ORBITEX trading experience is designed for desktop and mobile, with spot and futures tools in one account.</p><div className="store-buttons"><span> App Store</span><span>▶ Google Play</span></div></div><div className="mini-devices"><div className="mini-phone">ORBITEX<br/><small>TRADE WITHOUT LIMITS</small></div><div className="mini-chart">↗<br/><small>LIVE MARKETS</small></div></div></section>

      <section className="orbitex-stats"><div><b>20+</b><span>Trading Pairs</span></div><div><b>99.9%</b><span>Target Uptime</span></div><div><b>24/7</b><span>Customer Support</span></div><div><b>1</b><span>Unified Account</span></div></section>

      <section className="orbitex-security" id="security"><div className="orbit-shield">◇</div><div><div className="orbitex-eyebrow">SECURITY FIRST</div><h2>Built with control at every layer.</h2><p>Account balances, trading activity and privileged wallet operations are designed around server-side controls, audit trails and risk management.</p></div></section>

      <footer className="orbitex-footer"><span>Trade Smarter. Trade Together.</span><b>ORBITEX.</b></footer>
    </main>
  );
}
