import { create } from "zustand";
import { DepthPrice, OrderbookInfo } from "@/types/trading";

type CoinItem = {
  symbol: string;
  icon: string;
};

interface TransactState {
  ticker: string;
  coinList: CoinItem[];
  lastPrice: number | null;
  depthPrice: DepthPrice | null;
  orderbookInfo: OrderbookInfo | null;
  locale: string;
  countryCode: string;

  setTicker: (t: string) => void;
  setLastPrice: (p: number) => void;
  setDepthPrice: (d: DepthPrice) => void;
  setOrderbookInfo: (o: OrderbookInfo) => void;
  setLocale: (l: string) => void;
  setCountryCode: (c: string) => void;

  fetchCoinList: () => Promise<void>;
}

export const useTransactStore = create<TransactState>((set) => ({
  ticker: "BTC",
  coinList: [],
  lastPrice: null,
  depthPrice: null,
  orderbookInfo: null,
  locale: "en",
  countryCode: "US",

  setTicker: (t) => set({ ticker: t }),
  setLastPrice: (p) => set({ lastPrice: p }),
  setDepthPrice: (d) => set({ depthPrice: d }),
  setOrderbookInfo: (o) => set({ orderbookInfo: o }),
  setLocale: (l) => set({ locale: l }),
  setCountryCode: (c) => set({ countryCode: c }),

  fetchCoinList: async () => {
    const res = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo");
    const data = await res.json();

    const list = data.symbols
      .filter(
        (s: any) => s.contractType === "PERPETUAL" && s.quoteAsset === "USDT"
      )
      .map((s: any) => ({
        symbol: `${s.baseAsset}USDT`,
        icon: `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${s.baseAsset.toLowerCase()}.svg`,
      }));

    set({ coinList: list });
  },
}));
