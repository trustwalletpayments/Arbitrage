export type StoredOrder = { id:string; symbol:string; side:string; type:string; price:number; quantity:number; status:string; createdAt:string; testnet?:boolean };
export type StoredPosition = { id:string; symbol:string; side:string; entryPrice:number; markPrice:number; quantity:number; leverage:number; notional:number; margin:number; unrealizedPnl:number; liquidationPrice:number; takeProfit?:number; stopLoss?:number; status?:"OPEN"|"TP HIT"|"SL HIT"|"LIQUIDATED"|"CLOSED"; testnet?:boolean; closedAt?:string; realizedPnl?:number; closePrice?:number; settled?:boolean };
const ORDERS_KEY="exchange:testnet:orders",POSITIONS_KEY="exchange:testnet:positions";
function read<T>(key:string):T[]{if(typeof window==="undefined")return [];try{const v=window.localStorage.getItem(key),p=v?JSON.parse(v):[];return Array.isArray(p)?p:[]}catch{return []}}
function write<T>(key:string,value:T[]){if(typeof window!=="undefined")window.localStorage.setItem(key,JSON.stringify(value))}
export function getTestnetOrders():StoredOrder[]{return read<StoredOrder>(ORDERS_KEY)}
export function addTestnetOrder(order:StoredOrder){write(ORDERS_KEY,[order,...getTestnetOrders()])}
export function getTestnetPositions():StoredPosition[]{return read<StoredPosition>(POSITIONS_KEY)}
export function addTestnetPosition(position:StoredPosition){write(POSITIONS_KEY,[position,...getTestnetPositions()])}
export function updateTestnetPosition(id:string,patch:Partial<StoredPosition>){write(POSITIONS_KEY,getTestnetPositions().map(p=>p.id===id?{...p,...patch}:p))}
export function closeTestnetPosition(id:string,closePrice:number,status:"CLOSED"|"TP HIT"|"SL HIT"|"LIQUIDATED"="CLOSED"){const positions=getTestnetPositions(),p=positions.find(x=>x.id===id);if(!p||p.status!=="OPEN")throw new Error("Position is not open");const realizedPnl=status==="LIQUIDATED"?0:(p.side==="LONG"?closePrice-p.entryPrice:p.entryPrice-closePrice)*p.quantity;const updated={...p,markPrice:closePrice,closePrice,status,closedAt:new Date().toISOString(),realizedPnl,unrealizedPnl:0,settled:true};write(POSITIONS_KEY,positions.map(x=>x.id===id?updated:x));return updated}
