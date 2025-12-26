"use client";
import TradingChart from "@/app/_components/TradingChart";
import CoinSearch from "@/app/_components/CoinSearch";
import OrderBook from "@/app/_components/OrderBook";
import Transact from "@/app/_components/Transact";

export default function HomePage() {
  return (
    <div className="pt-[80px]">
      <CoinSearch />
      <div className="w-[90%] mx-auto flex items-center justify-between gap-[20px]">
        <TradingChart />
        <OrderBook />
        <Transact />
      </div>
    </div>
  );
}
