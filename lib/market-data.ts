export type MarketTicker = {symbol:string;price:number;change24h:number;volume24h:number};

// Supported USDT perpetual markets shown in the Futures selector.
export const MARKET_SYMBOLS=[
  "BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","DOGEUSDT","ADAUSDT","AVAXUSDT","LINKUSDT","TRXUSDT",
  "DOTUSDT","LTCUSDT","BCHUSDT","NEARUSDT","APTUSDT","ATOMUSDT","FILUSDT","ARBUSDT","OPUSDT","SUIUSDT",
  "PEPEUSDT","SHIBUSDT","ETCUSDT","UNIUSDT","AAVEUSDT","MATICUSDT","INJUSDT","TIAUSDT","SEIUSDT","TONUSDT",
  "WIFUSDT","BONKUSDT","FLOKIUSDT","ORDIUSDT","JASMYUSDT","RUNEUSDT","LDOUSDT","MKRUSDT","SNXUSDT","CRVUSDT",
  "COMPUSDT","SANDUSDT","MANAUSDT","AXSUSDT","GALAUSDT","APEUSDT","IMXUSDT","CHZUSDT","ENJUSDT","EGLDUSDT",
  "KAVAUSDT","ALGOUSDT","HBARUSDT","VETUSDT","ICPUSDT","XLMUSDT","EOSUSDT","XTZUSDT","THETAUSDT","FLOWUSDT",
  "PYTHUSDT","JTOUSDT","JUPUSDT","STRKUSDT","DYMUSDT","WLDUSDT","ARKMUSDT","ALTUSDT","MANTAUSDT","ONDOUSDT",
  "ENAUSDT","ETHFIUSDT","EIGENUSDT","TAOUSDT","FETUSDT","RENDERUSDT","GRTUSDT","QNTUSDT","ROSEUSDT","ONEUSDT",
  "IOTAUSDT","ZECUSDT","DASHUSDT","NEOUSDT","CAKEUSDT","1INCHUSDT","YFIUSDT","SUSHIUSDT","GMTUSDT","LUNCUSDT",
  "LPTUSDT","MASKUSDT","API3USDT","NOTUSDT","BOMEUSDT","MEWUSDT","TURBOUSDT","PEOPLEUSDT","SATSUSDT","1000SATSUSDT"
] as const;

export function displayPair(symbol:string){return symbol.endsWith("USDT")?`${symbol.slice(0,-4)}/USDT`:symbol}
export function binanceSymbol(pair:string){return pair.replace("/","").toUpperCase()}
export function formatPrice(value:number){if(value>=1000)return value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});if(value>=1)return value.toFixed(2);if(value>=0.01)return value.toFixed(4);return value.toFixed(8)}
export function formatVolume(value:number){if(value>=1e9)return `${(value/1e9).toFixed(2)}B`;if(value>=1e6)return `${(value/1e6).toFixed(1)}M`;if(value>=1e3)return `${(value/1e3).toFixed(1)}K`;return value.toFixed(0)}
