export type CurrencyCode = "USD" | "LKR";

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    decimals: 2,
  },
  LKR: {
    code: "LKR",
    symbol: "Rs.",
    name: "Sri Lankan Rupee",
    decimals: 2,
  },
};

export class CurrencyFormatter {
  private static defaultCurrency: CurrencyCode = "USD";

  static setDefaultCurrency(currency: CurrencyCode) {
    CurrencyFormatter.defaultCurrency = currency;
  }

  static getDefaultCurrency(): CurrencyCode {
    return CurrencyFormatter.defaultCurrency;
  }

  static format(
    amount: number,
    currency: CurrencyCode = CurrencyFormatter.defaultCurrency,
    showCode: boolean = false
  ): string {
    const currencyInfo = CURRENCIES[currency];
    const formattedAmount = amount.toFixed(currencyInfo.decimals);

    const parts = formattedAmount.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formatted = parts.join(".");

    if (currency === "LKR") {
      return showCode
        ? `${currencyInfo.symbol} ${formatted} ${currency}`
        : `${currencyInfo.symbol} ${formatted}`;
    } else {
      return showCode
        ? `${currencyInfo.symbol}${formatted} ${currency}`
        : `${currencyInfo.symbol}${formatted}`;
    }
  }

  static parse(
    value: string,
    currency: CurrencyCode = CurrencyFormatter.defaultCurrency
  ): number {
    const currencyInfo = CURRENCIES[currency];

    const cleanValue = value.replace(/[Rs.$,\s]/g, "");
    return parseFloat(cleanValue) || 0;
  }

  static getCurrencySymbol(
    currency: CurrencyCode = CurrencyFormatter.defaultCurrency
  ): string {
    return CURRENCIES[currency].symbol;
  }

  static getAllCurrencies(): Currency[] {
    return Object.values(CURRENCIES);
  }
}

export class ExchangeRateService {
  private static exchangeRates: Record<string, number> = {
    USD_TO_LKR: 320.0,
    LKR_TO_USD: 1 / 320.0,
  };

  static async convertCurrency(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rateKey = `${fromCurrency}_TO_${toCurrency}`;
    const rate = this.exchangeRates[rateKey];

    if (!rate) {
      throw new Error(
        `Exchange rate not available for ${fromCurrency} to ${toCurrency}`
      );
    }

    return amount * rate;
  }

  static async updateExchangeRates(): Promise<void> {
    // TODO: Implement real API call to get current exchange rates
    // For now, using static rates
    console.log("Exchange rates updated");
  }
}
