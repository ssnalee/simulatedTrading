export interface OrderLevel {
  price: number;
  amount: number;
}

export interface DepthPrice {
  bidPrice: number;
  askPrice: number;
}

export interface OrderbookInfo {
  bids: OrderLevel[];
  asks: OrderLevel[];
}

export interface BinanceTradeMessage {
  p: string; // price
}

export interface BinanceDepthMessage {
  a: [string, string][]; // asks
  b: [string, string][]; // bids
}