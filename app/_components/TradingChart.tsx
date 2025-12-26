"use client";

import { useEffect, useRef } from "react";
import { useTransactStore } from "@/stores/useTransactStore";
import { useTheme } from "next-themes";
import Datafeed from "@/lib/trading/datafeed";

type Props = {
  libraryPath?: string;
};

export default function TradingChart({
  libraryPath = "/charting_library/",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<any>(null);
  const scriptLoaded = useRef(false);
  const { ticker, locale, setTicker } = useTransactStore();
  const { theme: nextTheme } = useTheme();
  const theme = nextTheme === "dark" ? "Dark" : "Light";

  const transformSymbol = () => `Binance:${ticker}/USDT`;

  const loadScript = async () => {
    if (scriptLoaded.current) return;
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        `script[src='${libraryPath}charting_library.js']`
      );
      if (existing) {
        scriptLoaded.current = true;
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = `${libraryPath}charting_library.js`;
      script.onload = async () => {
        scriptLoaded.current = true;

        await new Promise((r) => setTimeout(r, 300));
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const initChart = async () => {
    if (!containerRef.current || !(window as any).TradingView) return;

    widgetRef.current?.remove();
    widgetRef.current = null;

    const symbol = transformSymbol();
    if (!symbol) return;

    const widget = new (window as any).TradingView.widget({
      symbol,
      datafeed: Datafeed,
      interval: "1h",
      container: containerRef.current,
      library_path: libraryPath,
      autosize: true,
      theme,
      locale,
      disabled_features: ["use_localstorage_for_settings"],
      enabled_features: ["create_volume_indicator_by_default"],
    });

    widget.onChartReady(() => {
      widget.applyOverrides?.({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    });

    widgetRef.current = widget;
  };

  useEffect(() => {
    const initialize = async () => {
      await loadScript();

      if (!ticker) return; 

      if (containerRef.current && containerRef.current.parentNode) {
        await initChart();
      } else {
        setTimeout(async () => {
          if (containerRef.current && containerRef.current.parentNode) {
            await initChart();
          }
        }, 300);
      }
    };

    initialize();

    return () => {
      widgetRef.current?.remove();
    };
  }, [ticker, theme, locale]);

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden h-[600px] w-full bg-app"
    />
  );
}
