// helpers.ts

export async function getSymbolApi(
  path: string,
  isRetry = false
): Promise<any> {
  const baseUrl = "https://fapi.binance.com";
  try {
    const response = await fetch(`${baseUrl}/${path}`);
    if (!response.ok) {
      if (!isRetry) {
        // 첫 번째 요청 실패 시 재시도
        return await getSymbolApi(path, true);
      } else {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
    }
    return await response.json();
  } catch (error) {
    if (!isRetry) {
      return await getSymbolApi(path, true);
    } else {
      throw error;
    }
  }
}

export async function makeApiRequest(path: string): Promise<any> {
  try {
    const response = await fetch(`https://fapi.binance.com/${path}`);
    if (!response.ok) throw new Error(`API 요청 실패: ${response.status}`);
    return await response.json();
  } catch (error: any) {
    throw new Error(`CryptoCompare request error: ${error.message || error}`);
  }
}

export interface SymbolId {
  short: string;
  full: string;
}

export function generateSymbol(
  exchange: string,
  fromSymbol: string,
  toSymbol: string
): SymbolId {
  const short = `${fromSymbol}/${toSymbol}`;
  return {
    short,
    full: `${exchange}:${short}`,
  };
}

export interface ParsedSymbol {
  exchange: string;
  fromSymbol: string;
  toSymbol: string;
}

export function parseFullSymbol(fullSymbol: string): ParsedSymbol | null {
  const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
  if (!match) return null;
  return {
    exchange: match[1],
    fromSymbol: match[2],
    toSymbol: match[3],
  };
}
