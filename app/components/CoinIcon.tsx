"use client";

type Props = { symbol: string; size?: number };

const FALLBACK: Record<string, string> = {BTC:"₿",ETH:"Ξ",BNB:"B",SOL:"S",XRP:"X",DOGE:"Ð",ADA:"A",AVAX:"A",LINK:"L",TRX:"T",DOT:"D",LTC:"Ł",BCH:"B",NEAR:"N",APT:"A",ATOM:"A",FIL:"F",ARB:"A",OP:"O",SUI:"S",PEPE:"P",SHIB:"S",ETC:"E",UNI:"U",AAVE:"A",MATIC:"M",USDT:"₮"};

export default function CoinIcon({symbol,size=32}:Props){
  const src=`https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;

  return (
    <span
      className="coin-logo"
      style={{
        width:size,
        height:size,
        minWidth:size,
        minHeight:size,
        flex:"0 0 auto",
        display:"inline-flex",
        alignItems:"center",
        justifyContent:"center",
        position:"relative",
        overflow:"hidden",
      }}
    >
      <img
        src={src}
        alt={`${symbol} logo`}
        width={size}
        height={size}
        loading="lazy"
        draggable={false}
        style={{
          display:"block",
          width:"100%",
          height:"100%",
          minWidth:"100%",
          minHeight:"100%",
          objectFit:"contain",
          objectPosition:"center",
          flex:"0 0 auto",
        }}
        onError={e=>{
          e.currentTarget.style.display="none";
          const next=e.currentTarget.nextElementSibling as HTMLElement|null;
          if(next)next.style.display="grid";
        }}
      />
      <b
        style={{
          display:"none",
          width:"100%",
          height:"100%",
          placeItems:"center",
          textAlign:"center",
          lineHeight:1,
        }}
      >
        {FALLBACK[symbol]||symbol.slice(0,1)}
      </b>
    </span>
  );
}
