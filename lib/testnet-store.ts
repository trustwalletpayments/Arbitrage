export type StoredOrder = { id: string; symbol: string; side: string; type: string; price: number; quantity: number; status: string; createdAt: string; testnet?: boolean };
export type StoredPosition = { id: string; symbol: string; side: string; entryPrice: number; markPrice: number; quantity: number; leverage: number; notional: number; margin: number; unrealizedPnl: number; liquidationPrice: number; takeProfit?: number; stopLoss?: number; status?: "OPEN" | "TP HIT" | "SL HIT" | "LIQUIDATED"; testnet?: boolean };

const ORDERS_KEY = "exchange:testnet:orders";
const POSITIONS_KEY = "exchange:testnet:positions";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
}

export function getTestnetOrders(): StoredOrder[] { return read<StoredOrder>(ORDERS_KEY); }
export function addTestnetOrder(order: StoredOrder) { write(ORDERS_KEY, [order, ...getTestnetOrders()]); }
export function getTestnetPositions(): StoredPosition[] { return read<StoredPosition>(POSITIONS_KEY); }
export function addTestnetPosition(position: StoredPosition) { write(POSITIONS_KEY, [position, ...getTestnetPositions()]); }
export function updateTestnetPosition(id: string, patch: Partial<StoredPosition>) {
  const positions = getTestnetPositions();
  write(POSITIONS_KEY, positions.map(position => position.id === id ? { ...position, ...patch } : position));
}
