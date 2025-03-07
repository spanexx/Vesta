import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export type SupportedCurrency = 'EUR' | 'USD' | 'GBP';

@Injectable({
  providedIn: 'root'
})
export class CurrencyConversionService {
  private rates: Record<SupportedCurrency, Record<SupportedCurrency, number>> = {
    EUR: { EUR: 1, USD: 1.09, GBP: 0.86 },
    USD: { EUR: 0.92, USD: 1, GBP: 0.79 },
    GBP: { EUR: 1.16, USD: 1.27, GBP: 1 }
  };

  constructor(private http: HttpClient) {}

  convert(amount: number, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency): number {
    const rate = this.rates[fromCurrency][toCurrency];
    return Math.round(amount * rate);
  }
}
