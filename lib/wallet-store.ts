export type WalletBalances={spot:number;futures:number};
export type WalletTransaction={id:string;type:"DEPOSIT"|"WITHDRAWAL"|"TRANSFER"|"TRADE";asset:string;amount:number;from?:string;to?:string;side?:"BUY"|"SELL";symbol?:string;status:"PENDING"|"COMPLETED";createdAt:string};
const BALANCES_KEY="exchange:testnet:balances";
const TX_KEY="exchange:testnet:wallet-transactions";
const INITIAL:WalletBalances={spot:9860.32,futures:2620};
function read<T>(key:string,fallback:T):T{if(typeof window==="undefined")return fallback;try{const v=window.localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
function write<T>(key:string,value:T){if(typeof window!=="undefined")window.localStorage.setItem(key,JSON.stringify(value))}
export function getBalances():WalletBalances{return read(BALANCES_KEY,INITIAL)}
export function setBalances(value:WalletBalances){write(BALANCES_KEY,value)}
export function getTransactions():WalletTransaction[]{return read<WalletTransaction[]>(TX_KEY,[])}
export function addTransaction(tx:WalletTransaction){write(TX_KEY,[tx,...getTransactions()])}
export function resetWallet(){write(BALANCES_KEY,INITIAL);write(TX_KEY,[])}
