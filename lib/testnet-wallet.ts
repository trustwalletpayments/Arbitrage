export type TestnetWallet = { asset:string; spot:number; futures:number };
export type TestnetTransaction = { id:string; type:"TRADE"|"TRANSFER"|"DEPOSIT"|"WITHDRAWAL"|"FUTURES_SETTLEMENT"; asset:string; amount:number; wallet:"SPOT"|"FUTURES"; side?:"BUY"|"SELL"|"LONG"|"SHORT"; symbol?:string; status:"COMPLETED"|"PENDING"; createdAt:string; note?:string; realizedPnl?:number };
const BALANCES_KEY="exchange:testnet:balances",TX_KEY="exchange:testnet:transactions";
const DEFAULTS:TestnetWallet[]=[{asset:"USDT",spot:9860.32,futures:2620},{asset:"BTC",spot:0.0842,futures:0},{asset:"ETH",spot:1.72,futures:0},{asset:"SOL",spot:14.8,futures:0},{asset:"BNB",spot:2,futures:0},{asset:"XRP",spot:250,futures:0},{asset:"DOGE",spot:1000,futures:0}];
const defaultBalances=()=>DEFAULTS.map(x=>({...x}));
function read<T>(key:string,fallback:T):T{if(typeof window==="undefined")return fallback;try{const v=window.localStorage.getItem(key),p=v?JSON.parse(v):fallback;return p as T}catch{return fallback}}
function write<T>(key:string,value:T){if(typeof window!=="undefined")window.localStorage.setItem(key,JSON.stringify(value))}
export function getTestnetBalances(){return read<TestnetWallet[]>(BALANCES_KEY,defaultBalances())}
export function setTestnetBalances(v:TestnetWallet[]){write(BALANCES_KEY,v)}
export function getTestnetTransactions(){return read<TestnetTransaction[]>(TX_KEY,[])}
export function addTestnetTransaction(tx:TestnetTransaction){write(TX_KEY,[tx,...getTestnetTransactions()])}
export function recordFuturesSettlement(input:{symbol:string;side:string;status:string;margin:number;realizedPnl:number}){addTestnetTransaction({id:crypto.randomUUID(),type:"FUTURES_SETTLEMENT",asset:"USDT",amount:input.margin,wallet:"FUTURES",side:(input.side==="SHORT"?"SHORT":"LONG"),symbol:input.symbol,status:"COMPLETED",createdAt:new Date().toISOString(),note:`Testnet ${input.status.toLowerCase()} settlement`,realizedPnl:input.realizedPnl})}
export function resetTestnetWallet(){setTestnetBalances(defaultBalances());write(TX_KEY,[])}
export function executeSpotTestnetTrade(input:{asset:string;side:"BUY"|"SELL";price:number;quantity:number;symbol:string}){
 const balances=getTestnetBalances();const quote=balances.find(x=>x.asset==="USDT"),base=balances.find(x=>x.asset===input.asset);if(!quote||!base)throw new Error("Asset is not supported");
 const cost=input.price*input.quantity;if(!Number.isFinite(cost)||cost<=0)throw new Error("Invalid order value");
 if(input.side==="BUY"){if(quote.spot<cost)throw new Error("Insufficient USDT balance");quote.spot-=cost;base.spot+=input.quantity}else{if(base.spot<input.quantity)throw new Error(`Insufficient ${input.asset} balance`);base.spot-=input.quantity;quote.spot+=cost}
 setTestnetBalances(balances);addTestnetTransaction({id:crypto.randomUUID(),type:"TRADE",asset:input.asset,amount:input.quantity,wallet:"SPOT",side:input.side,symbol:input.symbol,status:"COMPLETED",createdAt:new Date().toISOString(),note:"Testnet spot trade"});return balances
}