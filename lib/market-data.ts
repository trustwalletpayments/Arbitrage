export type MarketTicker = {symbol:string;price:number;change24h:number;volume24h:number};

export const MARKET_SYMBOLS=["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","DOGEUSDT","ADAUSDT","AVAXUSDT","LINKUSDT","TRXUSDT","DOTUSDT","LTCUSDT","BCHUSDT","NEARUSDT","APTUSDT","ATOMUSDT","FILUSDT","ARBUSDT","OPUSDT","SUIUSDT","PEPEUSDT","SHIBUSDT","ETCUSDT","UNIUSDT","AAVEUSDT","MATICUSDT"] as const;

export function displayPair(symbol:string){return symbol.endsWith("USDT")?`${symbol.slice(0,-4)}/USDT`:symbol}
export function binanceSymbol(pair:string){return pair.replace("/","").toUpperCase()}
export function formatPrice(value:number){if(value>=1000)return value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});if(value>=1)return value.toFixed(2);if(value>=0.01)return value.toFixed(4);return value.toFixed(8)}
export function formatVolume(value:number){if(value>=1e9)return `${(value/1e9).toFixed(2)}B`;if(value>=1e6)return `${(value/1e6).toFixed(1)}M`;if(value>=1e3)return `${(value/1e3).toFixed(1)}K`;return value.toFixed(0)}
