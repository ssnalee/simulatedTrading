import { VirtuosoGrid } from "react-virtuoso";

type Coin = {
  symbol: string;
  icon: string;
};

interface Props {
  coins: Coin[];
  onSelect: (symbol: string) => void;
}

export default function CoinGrid({ coins, onSelect }: Props) {
  return (
    <div className="h-[300px]">
      <VirtuosoGrid
        data={coins}
        overscan={100}
        listClassName="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-900 rounded p-4"
        itemClassName="flex items-center gap-1 justify-center text-gray-900 dark:text-gray-100 h-[32px] cursor-pointer"
        itemContent={(_, coin) => (
          <div onClick={() => onSelect(coin.symbol)}>
            <img
              className="w-5 h-5 object-contain"
              src={coin.icon}
              alt={coin.symbol}
              onError={(e) => (e.currentTarget.src = "/images/default.png")}
            />
            {coin.symbol}
          </div>
        )}
      />
    </div>
  );
}
