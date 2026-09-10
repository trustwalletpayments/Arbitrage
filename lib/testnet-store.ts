export type StoredOrder = { id: string; symbol: string; side: string; type: string; price: number; quantity: number; status: string; createdAt: string; testnet?: boolean };
export type StoredPosition = { id: string; symbol: string; side: string; entryPrice: number; markPrice: number; quantity: number; leverage: number; notional: number; margin: number; unrealizedPnl: number; liquidationPrice: number; takeProfit?: number; stopLoss?: number; status?: "OPEN" | "TP HIT" | "SL HIT" | "LIQUIDATED" | "CLOSED"; testnet?: boolean; closedAt?: string; realizedPnl?: number; closePrice?: number };
const ORDERS_KEY = "exchange:testnet:orders"; const POSITIONS_KEY = "exchange:testnet:positions";
function read<T>(key:string):T[]{if(typeof window==="undefined")return [];try{const v=window.localStorage.getItem(key);const p=v?JSON.parse(v):[];return Array.isArray(p)?p:[]}catch{return []}}
function write<T>(key:string,value:T[]){if(typeof window!=="undefined")window.localStorage.setItem(key,JSON.stringify(value))}
export function getTestnetOrders():StoredOrder[]{return read<StoredOrder>(ORDERS_KEY)}
export function addTestnetOrder(order:StoredOrder){write(ORDERS_KEY,[order,...getTestnetOrders()])}
export function getTestnetPositions():StoredPosition[]{return read<StoredPosition>(POSITIONS_KEY)}
export function addTestnetPosition(position:StoredPosition){write(POSITIONS_KEY,[position,...getTestnetPositions()])}
export function updateTestnetPosition(id:string,patch:Partial<StoredPosition>){write(POSITIONS_KEY,getTestnetPositions().map(p=>p.id===id?{...p,...patch}:p))}
export function closeTestnetPosition(id:string,closePrice:number){const positions=getTestnetPositions();const position=positions.find(p=>p.id===id);if(!position||position.status!=="OPEN")throw new Error("Position is not open");const realizedPnl=(position.side==="LONG"?closePrice-position.entryPrice:position.entryPrice-closePrice)*position.quantity;const updated={...position,markPrice:closePrice,closePrice,status:"CLOSED" as const,closedAt:new Date().toISOString(),realizedPnl,unrealizedPnl:0};write(POSITIONS_KEY,positions.map(p=>p.id===id?updated:p));return updated}
