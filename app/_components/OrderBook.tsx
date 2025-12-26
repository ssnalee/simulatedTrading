"use client";

import { useEffect, useRef, useState } from "react";
import { useTransactStore } from "@/stores/useTransactStore";
import throttle from "lodash/throttle";
import { useTranslations } from "next-intl";

type OrderLevel = { price: number; amount: number; sum?: number };

export default function OrderBook() {
  const t = useTranslations();
  const { ticker, orderbookInfo, lastPrice } = useTransactStore();

  const [displayOrderbook, setDisplayOrderbook] = useState<{
    bids: OrderLevel[];
    asks: OrderLevel[];
  }>({
    bids: [],
    asks: [],
  });

  // 최신 orderbookInfo를 Ref에 저장
  const orderbookRef = useRef(orderbookInfo);
  orderbookRef.current = orderbookInfo;

  // throttled setState
  const throttledUpdate = useRef(
    throttle(() => {
      if (!orderbookRef.current) return;
      setDisplayOrderbook({
        bids: orderbookRef.current.bids.slice(),
        asks: orderbookRef.current.asks.slice(),
      });
    }, 500)
  ).current;

  // orderbookInfo가 바뀔 때마다 throttledUpdate 호출
  useEffect(() => {
    if (!orderbookInfo) return;
    throttledUpdate();
  }, [orderbookInfo, throttledUpdate]);

  const addCumulativeSum = (orders: OrderLevel[]) => {
    let sum = 0;
    return orders.map((order) => {
      sum += order.amount;
      return { ...order, sum: Number(sum.toFixed(3)) };
    });
  };

  const sortedAsks = addCumulativeSum(
    [...displayOrderbook.asks].sort((a, b) => a.price - b.price)
  );
  const reversedAsks = [...sortedAsks].reverse();
  const sortedBids = addCumulativeSum(
    [...displayOrderbook.bids].sort((a, b) => b.price - a.price)
  );
  const maxSum = Math.max(
    Math.max(...sortedAsks.map((a) => a.sum ?? 0), 0),
    Math.max(...sortedBids.map((b) => b.sum ?? 0), 0)
  );

  const getDepthWidth = (sum: number, max: number) =>
    `${max === 0 ? 0 : (sum / max) * 100}%`;

  const formatQuantity = (value: number) => {
    if (value < 1_000) return value;
    if (value >= 1_000_000_000)
      return Math.floor((value / 1_000_000_000) * 100) / 100 + "B";
    if (value >= 1_000_000)
      return Math.floor((value / 1_000_000) * 100) / 100 + "M";
    if (value >= 1_000) return Math.floor((value / 1_000) * 100) / 100 + "K";
    return Math.floor(value * 100) / 100;
  };

  return (
    <div className="w-[350px] h-[600px] bg-app text-app p-2 rounded-md font-sans text-[12px]">
      <div className="text-center mb-1">
        <h4 className="text-app font-semibold">
          {ticker} {t("trading.orderbook.title")}
        </h4>
      </div>
      <div className="border-t border-gray-700 mb-1" />
      <div className="flex justify-between text-app mb-1">
        <div className="w-1/3 text-left">
          {t("trading.table.price")} (USDT)
        </div>
        <div className="w-1/3 text-right">
          {t("trading.table.size")} ({ticker})
        </div>
        <div className="w-1/3 text-right">
          {t("trading.orderbook.sum")} ({ticker})
        </div>
      </div>

      {/* Asks */}
      <div>
        {reversedAsks.slice(0, 10).map((ask, index) => (
          <div
            key={index}
            className="relative flex justify-between h-[22px] items-center px-1 overflow-hidden"
          >
            <div
              className="absolute top-0 bottom-0 right-0 bg-red-600 opacity-20"
              style={{ width: getDepthWidth(ask.sum ?? 0, maxSum) }}
            />
            <div className="w-1/3 text-left text-red-500">{ask.price}</div>
            <div className="w-1/3 text-right">{formatQuantity(ask.amount)}</div>
            <div className="w-1/3 text-right">{formatQuantity(ask.sum)}</div>
          </div>
        ))}
      </div>

      {/* Current Price */}
      <div className="text-[#0ecb81] font-bold text-[20px] my-2">
        {lastPrice ?? "-"}
      </div>

      {/* Bids */}
      <div>
        {sortedBids.slice(0, 10).map((bid, index) => (
          <div
            key={index}
            className="relative flex justify-between h-[22px] items-center px-1 overflow-hidden"
          >
            <div
              className="absolute top-0 bottom-0 right-0 bg-green-500 opacity-20"
              style={{ width: getDepthWidth(bid.sum ?? 0, maxSum) }}
            />
            <div className="w-1/3 text-left text-green-400">{bid.price}</div>
            <div className="w-1/3 text-right">{formatQuantity(bid.amount)}</div>
            <div className="w-1/3 text-right">{formatQuantity(bid.sum)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
