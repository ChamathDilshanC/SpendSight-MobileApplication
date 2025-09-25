
import { AccountService, CurrencyType } from "../services/AccountService";

export class CurrencyUtils {
  private static defaultCurrency: CurrencyType = "USD";


  static setDefaultCurrency(currency: CurrencyType) {
    CurrencyUtils.defaultCurrency = currency;
  }


  static getDefaultCurrency(): CurrencyType {
    return CurrencyUtils.defaultCurrency;
  }


  static formatCurrency(amount: number, currency?: CurrencyType): string {
    const currencyToUse = currency || CurrencyUtils.defaultCurrency;
    return AccountService.formatCurrency(amount, currencyToUse);
  }


  static getCurrencySymbol(currency?: CurrencyType): string {
    const currencyToUse = currency || CurrencyUtils.defaultCurrency;
    return AccountService.getCurrencySymbol(currencyToUse);
  }


  static format(amount: number): string {
    return CurrencyUtils.formatCurrency(amount);
  }
}


export const formatCurrency = (amount: number, currency?: CurrencyType) =>
  CurrencyUtils.formatCurrency(amount, currency);

export const getCurrencySymbol = (currency?: CurrencyType) =>
  CurrencyUtils.getCurrencySymbol(currency);
