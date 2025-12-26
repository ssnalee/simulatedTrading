import { parseFullSymbol } from "./helpers";

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SubscriptionHandler {
  id: string;
  callback: (bar: Bar) => void;
}

interface SubscriptionItem {
  subscriberUID: string;
  resolution: string;
  lastDailyBar: Bar;
  handlers: SubscriptionHandler[];
  symbolInfo: any;
}

const socket = new WebSocket("wss://fstream.binance.com/stream");
const channelToSubscription = new Map<string, SubscriptionItem>();

socket.onopen = () => {
  console.log("WebSocket connected.");
};

socket.onerror = (error) => {
  console.error("WebSocket error:", error);
};

socket.onmessage = (event: MessageEvent) => {
  const jsonData = JSON.parse(event.data);

  if (!jsonData.data || !jsonData.data.e || jsonData.data.e !== "kline") {
    return; // kline 이벤트가 아니면 무시
  }

  const kData = jsonData.data.k;
  const channelString = jsonData.stream;
  const subscriptionItem = channelToSubscription.get(channelString);
  if (!subscriptionItem) return;

  const lastDailyBar = subscriptionItem.lastDailyBar;

  const getNextBarTime = (barTime: number, resolution: string) => {
    const date = new Date(barTime);
    if (resolution.endsWith("m")) {
      date.setMinutes(date.getMinutes() + parseInt(resolution));
    } else if (resolution.endsWith("h")) {
      date.setHours(date.getHours() + parseInt(resolution));
    } else if (resolution.endsWith("d") || resolution.endsWith("w")) {
      date.setDate(date.getDate() + 1);
    }
    return date.getTime();
  };

  const nextDailyBarTime = getNextBarTime(
    lastDailyBar.time,
    subscriptionItem.resolution
  );

  let bar: Bar;
  if (kData.t >= nextDailyBarTime) {
    bar = {
      time: nextDailyBarTime,
      open: Number(kData.o),
      high: Number(kData.h),
      low: Number(kData.l),
      close: Number(kData.c),
      volume: Number(kData.v),
    };
  } else {
    bar = {
      time: Number(kData.t),
      open: Number(kData.o),
      high: Math.max(lastDailyBar.high, Number(kData.h)),
      low: Math.min(lastDailyBar.low, Number(kData.l)),
      close: Number(kData.c),
      volume: Number(kData.v),
    };
  }

  subscriptionItem.lastDailyBar = bar;
  subscriptionItem.handlers.forEach((handler) => handler.callback(bar));
};

// 구독
export function subscribeOnStream(
  symbolInfo: any,
  resolution: string,
  onRealtimeCallback: (bar: Bar) => void,
  subscriberUID: string,
  lastDailyBar: Bar
) {
  const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
  if (!parsedSymbol) return;

  const lowerSymbol =
    parsedSymbol.fromSymbol.toLowerCase() + parsedSymbol.toSymbol.toLowerCase();
  let channelString = `${lowerSymbol}@kline_${resolution}`;

  const handler: SubscriptionHandler = {
    id: subscriberUID,
    callback: onRealtimeCallback,
  };

  const existing = channelToSubscription.get(channelString);
  if (existing) {
    existing.handlers.push(handler);
    return;
  }

  channelToSubscription.set(channelString, {
    subscriberUID,
    resolution,
    lastDailyBar,
    handlers: [handler],
    symbolInfo,
  });

  socket.send(
    JSON.stringify({
      method: "SUBSCRIBE",
      params: [channelString],
      id: 1,
    })
  );
}

// 구독 해제
export function unsubscribeFromStream(subscriberUID: string) {
  for (const [
    channelString,
    subscriptionItem,
  ] of channelToSubscription.entries()) {
    const idx = subscriptionItem.handlers.findIndex(
      (h) => h.id === subscriberUID
    );
    if (idx !== -1) {
      subscriptionItem.handlers.splice(idx, 1);

      if (subscriptionItem.handlers.length === 0) {
        socket.send(
          JSON.stringify({
            method: "UNSUBSCRIBE",
            params: [channelString],
            id: 1,
          })
        );
        channelToSubscription.delete(channelString);
      }
      break;
    }
  }
}
