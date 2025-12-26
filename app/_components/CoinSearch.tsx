"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import throttle from "lodash/throttle";
import { useTransactStore } from "@/stores/useTransactStore";
import {
  BinanceTradeMessage,
  BinanceDepthMessage,
  OrderLevel,
} from "@/types/trading";
import { VirtuosoGrid } from "react-virtuoso";
import { useTranslations } from "next-intl";

type TickerStats = {
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
};

export default function CoinSearch() {
  const {
    ticker,
    coinList,
    setTicker,
    setDepthPrice,
    setOrderbookInfo,
    setLastPrice,
    fetchCoinList,
  } = useTransactStore();

  const t = useTranslations();

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const tradeWS = useRef<WebSocket | null>(null);
  const depthWS = useRef<WebSocket | null>(null);
  const tickerWS = useRef<WebSocket | null>(null);
  const prevPriceRef = useRef<number | null>(null);

  const [search, setSearch] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [priceColor, setPriceColor] = useState<"red" | "green" | "black">(
    "black"
  );
  const [showSearch, setShowSearch] = useState(false);
  const [tickerStats, setTickerStats] = useState<TickerStats | null>(null);

  const filteredCoins = useMemo(
    () =>
      search
        ? coinList.filter((v) => v.symbol.includes(search.toUpperCase()))
        : coinList,
    [coinList, search]
  );

  const updatePrice = throttle((newPrice: number) => {
    const prev = prevPriceRef.current;
    if (prev !== null) {
      if (newPrice > prev) setPriceColor("green");
      else if (newPrice < prev) setPriceColor("red");
    }
    prevPriceRef.current = newPrice;
    setPrice(newPrice);
    setLastPrice(newPrice);
  }, 500);

  /** ---- Trade Socket ---- */
  const connectTradeSocket = (pair: string) => {
    tradeWS.current?.close();

    tradeWS.current = new WebSocket(
      `wss://fstream.binance.com/ws/${pair.toLowerCase()}@trade`
    );

    tradeWS.current.onmessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data) as BinanceTradeMessage;
      const newPrice = parseFloat(data.p);
      if (!Number.isNaN(newPrice)) updatePrice(newPrice);
    };
  };

  /** ---- Depth Socket ---- */
  const connectDepthSocket = (pair: string) => {
    depthWS.current?.close();

    depthWS.current = new WebSocket(
      `wss://fstream.binance.com/ws/${pair.toLowerCase()}@depth20@100ms`
    );

    depthWS.current.onmessage = (e: MessageEvent) => {
      const d = JSON.parse(e.data) as BinanceDepthMessage;

      const toLevels = (rows: [string, string][]): OrderLevel[] =>
        rows.map(([p, a]) => ({
          price: parseFloat(p),
          amount: parseFloat(a),
        }));

      const bids = toLevels(d.b);
      const asks = toLevels(d.a);

      const bidPrice = parseFloat(d.b?.[0]?.[0] ?? "0");
      const askPrice = parseFloat(d.a?.[0]?.[0] ?? "0");

      setDepthPrice({ bidPrice, askPrice });
      setOrderbookInfo({ bids, asks });
    };
  };

  /** ---- 24th Socket ---- */
  const connect24hTickerSocket = (pair: string) => {
    tickerWS.current?.close();

    tickerWS.current = new WebSocket(
      `wss://fstream.binance.com/ws/${pair.toLowerCase()}@ticker`
    );

    tickerWS.current.onmessage = (e: MessageEvent) => {
      const t = JSON.parse(e.data);

      const info = {
        priceChange: parseFloat(t.p),
        priceChangePercent: parseFloat(t.P),
        highPrice: parseFloat(t.h),
        lowPrice: parseFloat(t.l),
        volume: parseFloat(t.v),
      };
      setTickerStats(info);
    };
  };

  const changeCoin = (coin: string) => {
    const symbol = coin.replace("USDT", "");

    setTicker(symbol);
    setSearch(symbol);
    setShowSearch(false);
  };

  useEffect(() => {
    const pair = `${ticker}USDT`;
    connectTradeSocket(pair);
    connectDepthSocket(pair);
    connect24hTickerSocket(pair);

    return () => {
      tradeWS.current?.close();
      depthWS.current?.close();
      tickerWS.current?.close();
    };
  }, [ticker]);

  useEffect(() => {
    if (!showSearch) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearch]);

  useEffect(() => {
    fetchCoinList();
  }, []);

  return (
    <div className="relative flex gap-2 px-10 py-4 mx-auto my-4 w-[90%] bg-app text-app rounded items-center justify-between">
      <div className="input-search" onClick={() => setShowSearch(true)}>
        <input
          className="bg-gray-300 rounded px-2 py-2 text-gray-900"
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
          placeholder={t("trading.search.searchCoin")}
        />
      </div>

      <p className={priceColor}>{price ?? "--"}</p>
      <p>
        {t("trading.search.24vol", { ticker: `${ticker}USDT` })} :{" "}
        {tickerStats?.volume}
      </p>
      <p>
        {t("trading.search.24low")} : {tickerStats?.lowPrice}
      </p>
      <p>
        {t("trading.search.24high")} : {tickerStats?.highPrice}
      </p>
      <p>
        {t("trading.search.24change")} : {tickerStats?.priceChangePercent}
      </p>

      {showSearch && (
        <div
          ref={dropdownRef}
          className="absolute w-full mt-[50px] h-[300px] bg-app rounded p-8 left-0 top-[30px] z-20 border border-blue-200"
        >
          <VirtuosoGrid
            data={filteredCoins}
            overscan={40}
            listClassName="grid grid-cols-4 auto-rows-min gap-2"
            itemContent={(_, c) => (
              <div
                className="flex gap-1 justify-center items-center text-app h-[30px] cursor-pointer"
                onClick={() => changeCoin(c.symbol)}
              >
                <img
                  className="w-5 h-5 object-contain"
                  src={c.icon}
                  alt={c.symbol}
                  onError={(e) => (e.currentTarget.src = "/images/default.png")}
                />
                {c.symbol}
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
