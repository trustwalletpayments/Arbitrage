"use client";

import { useState } from "react";
import Link from "next/link";
import CoinIcon from "./CoinIcon";
import styles from "./AuthGateMarketCard.module.css";

type Props = {
  symbol: string;
  name: string;
  price: string;
  change: string;
};

export default function AuthGateMarketCard({ symbol, name, price, change }: Props) {
  const [open, setOpen] = useState(false);
  const tradeHref = `/trade?pair=${encodeURIComponent(`${symbol}/USDT`)}`;

  return (
    <>
      <button type="button" className="market-card" onClick={() => setOpen(true)} aria-label={`Open ${symbol}/USDT market`}>
        <div className="market-card-top">
          <CoinIcon symbol={symbol} size={36} />
          <span>{symbol}/USDT</span>
        </div>
        <strong>{price}</strong>
        <em className={change.startsWith("-") ? "down" : "up"}>{change}</em>
        <div className="spark" />
      </button>

      {open && (
        <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby={`auth-title-${symbol}`} onMouseDown={() => setOpen(false)}>
          <div className={styles.modal} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close">×</button>
            <div className={styles.icon}><CoinIcon symbol={symbol} size={42} /></div>
            <div className={styles.eyebrow}>SIGN IN REQUIRED</div>
            <h2 id={`auth-title-${symbol}`}>Trade {symbol}/USDT</h2>
            <p>Log in to your ORBITEX account or create a free account to open this market and start trading.</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href={`/login?next=${encodeURIComponent(tradeHref)}`}>Log in</Link>
              <Link className={styles.secondary} href={`/signup?next=${encodeURIComponent(tradeHref)}`}>Create account</Link>
            </div>
            <button type="button" className={styles.cancel} onClick={() => setOpen(false)}>Continue browsing</button>
          </div>
        </div>
      )}
    </>
  );
}
