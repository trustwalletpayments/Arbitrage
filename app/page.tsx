const markets = [
  ["BTC/USDT", "$113,842.20", "+2.14%"],
  ["ETH/USDT", "$4,521.80", "+1.82%"],
  ["BNB/USDT", "$861.42", "+1.31%"],
  ["SOL/USDT", "$241.16", "+3.08%"],
  ["XRP/USDT", "$2.97", "+0.94%"],
  ["DOGE/USDT", "$0.2431", "+1.67%"],
  ["ADA/USDT", "$0.8842", "+0.71%"],
  ["AVAX/USDT", "$28.42", "+2.45%"],
];

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">ARBITRAGE<span>.</span></div>
        <nav className="nav">
          <a href="#markets">Markets</a><a href="#spot">Spot</a><a href="#futures">Futures</a>
        </nav>
        <div className="actions"><a className="btn" href="/login">Log in</a><a className="btn primary" href="/signup">Create account</a></div>
      </header>

      <section className="hero">
        <div className="eyebrow">Next-generation digital asset exchange</div>
        <h1>Trade crypto with<br/>precision.</h1>
        <p>Arbitrage is being built as a centralized trading platform with spot markets, futures, real-time pricing, account balances and a secure wallet system.</p>
        <div className="actions"><a className="btn primary" href="/signup">Start trading</a><a className="btn" href="#markets">View markets</a></div>
      </section>

      <section className="grid">
        <div className="card"><div className="label">24h Volume</div><div className="value">$—</div></div>
        <div className="card"><div className="label">Markets</div><div className="value">20+</div></div>
        <div className="card"><div className="label">Trading</div><div className="value">Spot + Futures</div></div>
        <div className="card"><div className="label">Platform</div><div className="value">Live build</div></div>
      </section>

      <section className="markets" id="markets">
        <h2>Markets</h2>
        <table className="table"><thead><tr><th>Pair</th><th>Last price</th><th>24h change</th></tr></thead><tbody>
          {markets.map(([pair,price,change]) => <tr key={pair}><td>{pair}</td><td>{price}</td><td className="up">{change}</td></tr>)}
        </tbody></table>
        <p className="muted">Prices shown here are initial UI placeholders. The production build will connect this table to the exchange price feed.</p>
      </section>
    </main>
  );
}
