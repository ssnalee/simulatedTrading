import { useTransactStore } from "@/stores/useTransactStore";
import {
  getSymbolApi,
  makeApiRequest,
  generateSymbol,
  parseFullSymbol,
} from "./helpers";
import { subscribeOnStream, unsubscribeFromStream } from "./streaming";

// 최근 바 기록용
const lastBarsCache: Map<string, any> = new Map();

// DatafeedConfiguration
const configurationData = {
  supported_resolutions: [
    "1",
    "3",
    "5",
    "15",
    "30",
    "60",
    "120",
    "240",
    "360",
    "480",
    "720",
    "1D",
    "3D",
    "1W",
    "1M",
    "3M",
    "6M",
    "12M",
  ],
  exchanges: [{ value: "Binance", name: "Binance", desc: "Binance" }],
  symbols_types: [{ name: "crypto", value: "crypto" }],
};

// 모든 심볼 가져오기
async function getAllSymbols() {
  const data = useTransactStore.getState().coinList || [];
  const exchange = configurationData.exchanges[0].value;
  const allSymbols = data.map((ticker) => {
    const baseAsset = ticker.symbol.replace("USDT", "");
    return {
      symbol: `${baseAsset}/USDT`,
      full_name: `${exchange}:${baseAsset}/USDT`,
      description: `${baseAsset}/USDT`,
      exchange,
      type: "crypto",
    };
  });
  return allSymbols;
}

// Datafeed 객체
const Datafeed = {
  onReady: (callback: (config: typeof configurationData) => void) => {
    setTimeout(() => callback(configurationData), 0);
  },

  searchSymbols: async (
    userInput: string,
    exchange: string,
    symbolType: string,
    onResultReadyCallback: (symbols: any[]) => void
  ) => {
    const symbols = await getAllSymbols();
    const filtered = symbols.filter((symbol) => {
      const matchExchange = !exchange || symbol.exchange === exchange;
      const matchInput = symbol.full_name
        .toLowerCase()
        .includes(userInput.toLowerCase());
      return matchExchange && matchInput;
    });
    onResultReadyCallback(filtered);
  },

  resolveSymbol: async (
    symbolName: string,
    onSymbolResolvedCallback: (symbolInfo: any) => void,
    onResolveErrorCallback: (error: string) => void
  ) => {
    const symbols = await getAllSymbols();
    const symbolItem = symbols.find(
      (s) => s.full_name.toLowerCase() === symbolName.toLowerCase()
    );

    if (!symbolItem) {
      onResolveErrorCallback("cannot resolve symbol");
      return;
    }

    const symbolInfo = {
      ticker: symbolItem.full_name,
      name: symbolItem.symbol,
      description: symbolItem.description,
      type: symbolItem.type,
      session: "24x7",
      timezone: "Etc/UTC",
      exchange: symbolItem.exchange,
      minmov: 1,
      pricescale: 100000,
      visible_plots_set: "ohlcv",
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: true,
      supported_resolutions: configurationData.supported_resolutions,
      intraday_multipliers: [
        "1",
        "3",
        "5",
        "15",
        "30",
        "60",
        "120",
        "240",
        "360",
        "480",
        "720",
      ],
      daily_multipliers: ["1", "3"],
      weekly_multipliers: ["1"],
      monthly_multipliers: ["1"],
      volume_precision: 1,
      data_status: "streaming",
    };

    onSymbolResolvedCallback(symbolInfo);
  },

  getBars: async (
    symbolInfo: any,
    resolution: string,
    periodParams: { from: number; to: number; firstDataRequest: boolean },
    onHistoryCallback: (bars: any[], meta: { noData: boolean }) => void,
    onErrorCallback: (error: any) => void
  ) => {
    const { from, to, firstDataRequest } = periodParams;
    const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
     if (!parsedSymbol) {
       onErrorCallback(new Error(`Invalid symbol: ${symbolInfo.full_name}`));
       return;
     }
    const urlParameters: Record<string, any> = {
      pair: parsedSymbol?.fromSymbol + parsedSymbol?.toSymbol,
      limit: 1500,
      contractType: "PERPETUAL",
    };

    if (resolution === "1") urlParameters.interval = "1m";
    else if (resolution === "3") urlParameters.interval = "3m";
    else if (resolution === "5") urlParameters.interval = "5m";
    else if (resolution === "15") urlParameters.interval = "15m";
    else if (resolution === "30") urlParameters.interval = "30m";
    else if (resolution === "60") urlParameters.interval = "1h";
    else if (resolution === "120") urlParameters.interval = "2h";
    else if (resolution === "240") urlParameters.interval = "4h";
    else if (resolution === "360") urlParameters.interval = "6h";
    else if (resolution === "480") urlParameters.interval = "8h";
    else if (resolution === "720") urlParameters.interval = "12h";
    else if (resolution === "1D") urlParameters.interval = "1d";
    else if (resolution === "3D") urlParameters.interval = "3d";
    else if (resolution === "1W") urlParameters.interval = "1w";
    else urlParameters.interval = "1M";

    try {
      urlParameters.endTime = to * 1000;
      const query = Object.keys(urlParameters)
        .map((k) => `${k}=${encodeURIComponent(urlParameters[k])}`)
        .join("&");
      const data = await makeApiRequest(`fapi/v1/continuousKlines?${query}`);

      if (!data || data.length === 0 || data.Response === "Error") {
        onHistoryCallback([], { noData: true });
        return;
      }

      const bars = data
        .filter((bar: any) => bar[0] >= from * 1000 && bar[0] < to * 1000)
        .map((bar: any) => ({
          time: Number(bar[0]),
          open: Number(bar[1]),
          high: Number(bar[2]),
          low: Number(bar[3]),
          close: Number(bar[4]),
          volume: Number(bar[5]),
        }));

      if (firstDataRequest && bars.length) {
        lastBarsCache.set(symbolInfo.full_name, { ...bars[bars.length - 1] });
      }

      onHistoryCallback(bars, { noData: false });
    } catch (error) {
      onErrorCallback(error);
    }
  },

  subscribeBars: (
    symbolInfo: any,
    resolution: string,
    onRealtimeCallback: (bar: any) => void,
    subscriberUID: string,
    onResetCacheNeededCallback: () => void
  ) => {
    subscribeOnStream(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscriberUID,
      lastBarsCache.get(symbolInfo.full_name)
    );
  },

  unsubscribeBars: (subscriberUID: string) => {
    unsubscribeFromStream(subscriberUID);
  },
};

export default Datafeed;
