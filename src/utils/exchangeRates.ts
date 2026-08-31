export interface ExchangeRate {
  currency: string;
  symbol: string;
  nameArm: string;
  rateToAMD: number;
  lastUpdated: string;
  change?: number;
}

export const DEFAULT_CBA_RATES: Record<string, ExchangeRate> = {
  AMD: { currency: "AMD", symbol: "֏", nameArm: "ՀՀ Դրամ", rateToAMD: 1.0, lastUpdated: new Date().toISOString() },
  USD: { currency: "USD", symbol: "$", nameArm: "ԱՄՆ դոլար", rateToAMD: 388.50, lastUpdated: new Date().toISOString() },
  EUR: { currency: "EUR", symbol: "€", nameArm: "Եվրո", rateToAMD: 424.20, lastUpdated: new Date().toISOString() },
  RUB: { currency: "RUB", symbol: "₽", nameArm: "Ռուսական ռուբլի", rateToAMD: 4.35, lastUpdated: new Date().toISOString() },
  GBP: { currency: "GBP", symbol: "£", nameArm: "Բրիտանական ֆունտ", rateToAMD: 508.90, lastUpdated: new Date().toISOString() },
};

let currentRates: Record<string, ExchangeRate> = { ...DEFAULT_CBA_RATES };
const listeners = new Set<(rates: Record<string, ExchangeRate>) => void>();

export function subscribeCBARates(callback: (rates: Record<string, ExchangeRate>) => void): () => void {
  listeners.add(callback);
  callback(currentRates);
  return () => {
    listeners.delete(callback);
  };
}

export async function fetchCBARates(force = false): Promise<Record<string, ExchangeRate>> {
  try {
    const url = force ? "/api/cba-rates?refresh=true" : "/api/cba-rates";
    const res = await fetch(url).catch(() => null);
    if (res && res.ok) {
      const json = await res.json();
      if (json && json.rates) {
        currentRates = {
          ...DEFAULT_CBA_RATES,
          ...json.rates,
        };
        try {
          localStorage.setItem("sil_cba_rates_cache", JSON.stringify(currentRates));
        } catch {}
        listeners.forEach((l) => l(currentRates));
        return currentRates;
      }
    }
  } catch {}

  try {
    const local = localStorage.getItem("sil_cba_rates_cache");
    if (local) {
      const parsed = JSON.parse(local);
      currentRates = { ...DEFAULT_CBA_RATES, ...parsed };
      listeners.forEach((l) => l(currentRates));
      return currentRates;
    }
  } catch {}

  return DEFAULT_CBA_RATES;
}

export function getCurrentCbaRates(): Record<string, ExchangeRate> {
  return currentRates;
}

export function convertCurrency(amountInAMD: number, targetCurrency: string, rates: Record<string, ExchangeRate> = currentRates): { amount: number; symbol: string; formatted: string } {
  const rateObj = rates[targetCurrency] || rates.AMD;
  const rate = rateObj.rateToAMD || 1;
  const converted = amountInAMD / rate;
  const symbol = rateObj.symbol || "֏";
  
  const formatted = new Intl.NumberFormat("hy-AM", {
    style: "currency",
    currency: targetCurrency === "AMD" ? "AMD" : targetCurrency,
    maximumFractionDigits: 0,
  }).format(converted).replace(targetCurrency, symbol);

  return { amount: Math.round(converted), symbol, formatted };
}
