import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError } from 'rxjs/operators';

interface PaymentIntent {
  clientSecret: string;
  paymentId: string;
}

export interface SubscriptionIntent extends PaymentIntent {
  subscriptionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {
    console.log('Payment Service URL:', this.apiUrl); // Add this for debugging
  }

  createPaymentIntent(
    amount: number,
    currency: string,
    serviceDetails: any
  ): Observable<PaymentIntent> {
    const payload = { amount, currency, serviceDetails };
    console.log('Creating payment intent:', payload); // Add this for debugging
    
    return this.http.post<PaymentIntent>(`${this.apiUrl}/create-payment-intent`, payload)
      .pipe(
        catchError(error => {
          console.error('Payment intent creation failed:', error);
          throw error;
        })
      );
  }

  createSubscription(
    amount: number,
    currency: string,
    serviceDetails: any,
    interval: 'month' | 'year',
    paymentMethodId: string
  ): Observable<SubscriptionIntent> {
    const payload = {
      amount,
      currency,
      serviceDetails,
      interval,
      paymentMethodId
    };
    
    return this.http.post<SubscriptionIntent>(
      `${this.apiUrl}/create-subscription`,
      payload
    ).pipe(
      catchError(error => {
        console.error('Subscription creation failed:', error);
        throw new Error(error.error?.message || 'Failed to create subscription');
      })
    );
  }

  // Add methods for fetching payment history, etc.
}
