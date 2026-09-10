const markets = [
  ["BTC/USDT", "$113,842.20", "+2.14%"],
  ["ETH/USDT", "$4,521.80", "+1.82%"],
  ["BNB/USDT", "$861.42", "+1.31%"],
  ["SOL/USDT", "$241.16", "+3.08%"],
  ["XRP/USDT", "$2.97", "+0.94%"],
  ["DOGE/USDT", "$0.2431", "+1.67%"],
  ["ADA/USDT", "$0.8842", "+0.71%"],
  ["AVAX/USDT", "$28.42", "+2.45%"],
  ["LINK/USDT", "$23.61", "+1.16%"],
  ["TRX/USDT", "$0.3472", "+0.53%"],
];

const features = [
  ["01", "Spot trading", "Market and limit order infrastructure with balances, orders and trade history."],
  ["02", "Futures trading", "Long and short positions, leverage, margin, TP/SL and liquidation logic."],
  ["03", "Unified wallet", "Spot and futures wallets with deposits, withdrawals, transfers and ledger history."],
];

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">ORBITEX<span>.</span></div>
        <nav className="nav"><a href="#markets">Markets</a><a href="#spot">Spot</a><a href="#futures">Futures</a><a href="#security">Security</a></nav>
        <div className="actions"><a className="btn" href="/login">Log in</a><a className="btn primary" href="/signup">Create account</a></div>
      </header>

      <section className="hero">
        <div className="eyebrow">DIGITAL ASSET EXCHANGE</div>
        <h1>A trading platform<br/>built for <span>control.</span></h1>
        <p>Trade spot and futures markets from one account. Real-time market data, professional order tools and a unified wallet experience are being built into the platform.</p>
        <div className="actions"><a className="btn primary" href="/signup">Start trading</a><a className="btn" href="#markets">Explore markets</a></div>
      </section>

      <section className="grid">
        <div className="card"><div className="label">Markets</div><div className="value">20+</div><div className="sub">Planned trading pairs</div></div>
        <div className="card"><div className="label">Products</div><div className="value">Spot + Futures</div><div className="sub">One account</div></div>
        <div className="card"><div className="label">Wallets</div><div className="value">Unified</div><div className="sub">Deposit · Withdraw · Transfer</div></div>
        <div className="card"><div className="label">Status</div><div className="value">Building</div><div className="sub">Testnet-first development</div></div>
      </section>

      <section className="markets" id="markets">
        <div className="section-head"><div><div className="eyebrow">MARKET OVERVIEW</div><h2>Popular markets</h2></div><span className="muted">UI preview</span></div>
        <table className="table"><thead><tr><th>Pair</th><th>Last price</th><th>24h change</th></tr></thead><tbody>
          {markets.map(([pair,price,change]) => <tr key={pair}><td>{pair}</td><td>{price}</td><td className="up">{change}</td></tr>)}
        </tbody></table>
        <p className="muted">These are interface placeholder values until the live market-data service is connected.</p>
      </section>

      <section className="feature-grid" id="spot">
        {features.map(([num,title,text]) => <article className="feature" key={num}><div className="feature-num">{num}</div><h3>{title}</h3><p>{text}</p></article>)}
      </section>

      <section className="security" id="security"><div><div className="eyebrow">SECURITY ARCHITECTURE</div><h2>Balances backed by a proper ledger.</h2></div><p>Account balances will be derived from server-side ledger entries rather than editable client-side values. Privileged wallet operations stay on the server, with audit trails and withdrawal controls.</p></section>

      <footer>ORBITEX · Exchange foundation · <span>Testnet-first development</span></footer>
    </main>
  );
}
