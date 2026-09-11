"use client";

type Props = { symbol: string; size?: number };
const FALLBACK: Record<string, string> = {BTC:"₿",ETH:"Ξ",BNB:"B",SOL:"S",XRP:"X",DOGE:"Ð",ADA:"A",AVAX:"A",LINK:"L",TRX:"T",DOT:"D",LTC:"Ł",BCH:"B",NEAR:"N",APT:"A",ATOM:"A",FIL:"F",ARB:"A",OP:"O",SUI:"S",PEPE:"P",SHIB:"S",ETC:"E",UNI:"U",AAVE:"A",MATIC:"M",USDT:"₮"};
export default function CoinIcon({symbol,size=32}:Props){const src=`https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;return <span className="coin-logo" style={{width:size,height:size}}><img src={src} alt={`${symbol} logo`} width={size} height={size} loading="lazy" onError={e=>{e.currentTarget.style.display="none";const next=e.currentTarget.nextElementSibling as HTMLElement|null;if(next)next.style.display="grid";}}/><b style={{display:"none",width:"100%",height:"100%",placeItems:"center"}}>{FALLBACK[symbol]||symbol.slice(0,1)}</b></span>}
