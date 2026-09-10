export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";
export type PositionSide = "LONG" | "SHORT";

export type SpotOrder = { id:string; symbol:string; side:OrderSide; type:OrderType; price:number; quantity:number; status:"OPEN"|"FILLED"|"CANCELLED"; createdAt:string };
export type FuturesPosition = { symbol:string; side:PositionSide; entryPrice:number; markPrice:number; quantity:number; leverage:number; margin:number; takeProfit?:number; stopLoss?:number };

export function notional(price:number, quantity:number){return Math.max(0,price)*Math.max(0,quantity)}
export function initialMargin(price:number, quantity:number, leverage:number){if(leverage<=0) throw new Error("Leverage must be greater than zero");return notional(price,quantity)/leverage}
export function unrealizedPnl(side:PositionSide, entry:number, mark:number, quantity:number){const move=side==="LONG"?mark-entry:entry-mark;return move*quantity}
export function pnlPercent(side:PositionSide, entry:number, mark:number){if(entry<=0)return 0;return ((side==="LONG"?mark-entry:entry-mark)/entry)*100}
export function estimatedLiquidationPrice(side:PositionSide, entry:number, leverage:number, maintenanceRate=0.005){if(entry<=0||leverage<=0)throw new Error("Invalid position inputs");const buffer=Math.max(maintenanceRate,1/leverage);return side==="LONG"?entry*(1-buffer):entry*(1+buffer)}

export function validateOrder(input:{price:number;quantity:number;leverage?:number}){if(!Number.isFinite(input.price)||input.price<=0)throw new Error("Price must be positive");if(!Number.isFinite(input.quantity)||input.quantity<=0)throw new Error("Quantity must be positive");if(input.leverage!==undefined&&(!Number.isFinite(input.leverage)||input.leverage<1||input.leverage>100))throw new Error("Leverage must be between 1x and 100x");return true}
