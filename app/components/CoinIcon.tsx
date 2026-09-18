"use client";

import { TokenIcon } from "@web3icons/react/dynamic";

type Props = { symbol: string; size?: number };

const FALLBACK: Record<string, string> = {
  BTC:"₿", ETH:"Ξ", BNB:"B", SOL:"S", XRP:"X", DOGE:"Ð", ADA:"A", AVAX:"A",
  LINK:"L", TRX:"T", DOT:"D", LTC:"Ł", BCH:"B", NEAR:"N", APT:"A", ATOM:"A",
  FIL:"F", ARB:"A", OP:"O", SUI:"S", PEPE:"P", SHIB:"S", ETC:"E", UNI:"U",
  AAVE:"A", MATIC:"M", POL:"P", USDT:"₮", USDC:"$", TON:"T", XLM:"X"
};

export default function CoinIcon({ symbol, size = 32 }: Props) {
  const normalized = symbol.trim().toLowerCase();
  const fallback = FALLBACK[symbol.toUpperCase()] || symbol.slice(0, 2).toUpperCase();

  return (
    <span
      className="coin-logo"
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        flex: "0 0 auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
      aria-label={`${symbol} logo`}
    >
      <TokenIcon
        symbol={normalized}
        size={size}
        variant="branded"
        fallback={
          <b style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", lineHeight: 1 }}>
            {fallback}
          </b>
        }
      />
    </span>
  );
}
