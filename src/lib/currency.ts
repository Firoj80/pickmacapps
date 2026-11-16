/**
 * Currency Conversion & Localization Utility for Dodo Payments Adaptive Pricing
 */

export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "INR"
  | "CAD"
  | "AUD"
  | "JPY"
  | "BRL"
  | "SGD"
  | "CHF";

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  defaultRate: number; // fallback USD -> Currency rate
};

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸", defaultRate: 1.0 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺", defaultRate: 0.91 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧", defaultRate: 0.79 },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳", defaultRate: 94.4 },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar", flag: "🇨🇦", defaultRate: 1.40 },
  AUD: { code: "AUD", symbol: "AU$", name: "Australian Dollar", flag: "🇦🇺", defaultRate: 1.55 },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵", defaultRate: 154.0 },
  BRL: { code: "BRL", symbol: "R$", name: "Brazilian Real", flag: "🇧🇷", defaultRate: 5.85 },
  SGD: { code: "SGD", symbol: "SG$", name: "Singapore Dollar", flag: "🇸🇬", defaultRate: 1.34 },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc", flag: "🇨🇭", defaultRate: 0.88 },
};

export const CURRENCY_LIST: CurrencyInfo[] = Object.values(SUPPORTED_CURRENCIES);

export const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  IN: "INR",
  GB: "GBP",
  // Eurozone
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  IE: "EUR",
  PT: "EUR",
  FI: "EUR",
  GR: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
  SK: "EUR",
  SI: "EUR",
  CY: "EUR",
  MT: "EUR",
  LU: "EUR",
  // Other Americas / APAC
  CA: "CAD",
  AU: "AUD",
  NZ: "AUD",
  JP: "JPY",
  BR: "BRL",
  SG: "SGD",
  CH: "CHF",
  LI: "CHF",
  US: "USD",
};

/**
 * Clean charm rounding for localized prices to avoid awkward decimal numbers
 */
function charmRound(amount: number, currency: CurrencyCode): number {
  if (currency === "USD") return Math.round(amount);
  if (currency === "JPY") {
    // Round to nearest 50 or 90
    return Math.round(amount / 50) * 50;
  }
  if (currency === "INR") {
    // Round to clean 49 or 99 endings, or nearest 50
    const rounded = Math.round(amount);
    const mod100 = rounded % 100;
    if (mod100 >= 35 && mod100 <= 65) return rounded - mod100 + 49;
    if (mod100 > 65) return rounded - mod100 + 99;
    return rounded - mod100 + (mod100 > 15 ? 49 : 0);
  }
  if (currency === "BRL") {
    return Math.round(amount);
  }
  // EUR, GBP, CAD, AUD, SGD, CHF: round to nearest whole integer
  return Math.round(amount);
}

/**
 * Convert USD price in dollars to selected target currency
 */
export function convertPrice(
  usdDollars: number,
  currency: CurrencyCode,
  rates?: Record<string, number> | null
): {
  amount: number;
  formatted: string;
  symbol: string;
  currency: CurrencyCode;
  isConverted: boolean;
} {
  if (usdDollars === 0) {
    return {
      amount: 0,
      formatted: "$0",
      symbol: "$",
      currency,
      isConverted: false,
    };
  }

  if (currency === "USD") {
    return {
      amount: usdDollars,
      formatted: `$${usdDollars}`,
      symbol: "$",
      currency: "USD",
      isConverted: false,
    };
  }

  const rate = rates?.[currency] ?? SUPPORTED_CURRENCIES[currency]?.defaultRate ?? 1.0;
  const rawConverted = usdDollars * rate;
  const rounded = charmRound(rawConverted, currency);
  const info = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;

  let formatted = `${info.symbol}${rounded.toLocaleString()}`;
  if (currency === "CHF") {
    formatted = `${rounded.toLocaleString()} CHF`;
  }

  return {
    amount: rounded,
    formatted,
    symbol: info.symbol,
    currency,
    isConverted: true,
  };
}

/**
 * Detect user currency from country code or browser timezone
 */
export function detectLocalCurrency(serverCountry?: string | null): CurrencyCode {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("pma_currency");
    if (saved && saved in SUPPORTED_CURRENCIES) {
      return saved as CurrencyCode;
    }
  }

  if (serverCountry) {
    const upper = serverCountry.toUpperCase().trim();
    if (upper in COUNTRY_TO_CURRENCY) {
      return COUNTRY_TO_CURRENCY[upper];
    }
  }

  if (typeof window !== "undefined") {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.includes("Kolkata") || tz.includes("Calcutta") || tz.includes("India")) return "INR";
      if (tz.includes("London")) return "GBP";
      if (tz.includes("Tokyo")) return "JPY";
      if (tz.includes("Sydney") || tz.includes("Melbourne") || tz.includes("Brisbane")) return "AUD";
      if (tz.includes("Toronto") || tz.includes("Vancouver") || tz.includes("Montreal")) return "CAD";
      if (tz.includes("Sao_Paulo") || tz.includes("Brazil")) return "BRL";
      if (tz.includes("Singapore")) return "SGD";
      if (tz.includes("Zurich")) return "CHF";
      if (
        tz.includes("Berlin") ||
        tz.includes("Paris") ||
        tz.includes("Rome") ||
        tz.includes("Madrid") ||
        tz.includes("Amsterdam")
      ) {
        return "EUR";
      }

      // Check navigator language
      const lang = navigator.language || "";
      if (lang.endsWith("-IN") || lang.startsWith("hi")) return "INR";
      if (lang.endsWith("-GB")) return "GBP";
      if (lang.endsWith("-JP") || lang.startsWith("ja")) return "JPY";
      if (lang.endsWith("-CA")) return "CAD";
      if (lang.endsWith("-AU")) return "AUD";
      if (lang.endsWith("-BR") || lang.startsWith("pt-BR")) return "BRL";
      if (lang.endsWith("-DE") || lang.endsWith("-FR") || lang.endsWith("-IT") || lang.endsWith("-ES")) return "EUR";
    } catch {
      // ignore
    }
  }

  return "USD";
}

// In-memory cache for live exchange rates
let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null;
const RATES_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Fetch latest USD-based exchange rates with 12h in-memory caching and fallback
 */
export async function getLiveExchangeRates(): Promise<Record<string, number>> {
  if (cachedRates && Date.now() - cachedRates.timestamp < RATES_CACHE_TTL_MS) {
    return cachedRates.rates;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (res.ok) {
      const data = (await res.json()) as { rates?: Record<string, number> };
      if (data && data.rates && typeof data.rates.EUR === "number") {
        cachedRates = { rates: data.rates, timestamp: Date.now() };
        return data.rates;
      }
    }
  } catch {
    // Fall back gracefully
  }

  // Fallback to static defaults
  const fallback: Record<string, number> = {};
  for (const [code, info] of Object.entries(SUPPORTED_CURRENCIES)) {
    fallback[code] = info.defaultRate;
  }
  return fallback;
}
