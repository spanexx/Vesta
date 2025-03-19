import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, map } from 'rxjs/operators';

interface PaymentIntent {
  clientSecret: string;
  paymentId: string;
}

export interface SubscriptionIntent extends PaymentIntent {
  subscriptionId: string;
}

export interface ManualPayment {
  _id: string;
  username: string;
  email: string;
  plan: string;
  amount: string;
  interval: string;
  image: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {
  }

  createPaymentIntent(
    amount: number,
    currency: string,
    serviceDetails: any
  ): Observable<PaymentIntent> {
    const payload = { amount, currency, serviceDetails };
    console.log('Creating payment intent:', payload);
    
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
    console.log('Creating subscription:', payload);
    
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

  submitManualPayment(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/manual-payment`, formData).pipe(
      catchError(error => {
        console.error('Manual payment submission failed:', error);
        throw new Error(error.error?.message || 'Failed to submit manual payment');
      })
    );
  }

  updateAdminManualPayment(data: { manualPaymentData: any }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/update-admin-manual-payment`, data)
      .pipe(
        catchError(error => {
          console.error('Admin manual payment update failed:', error);
          throw error;
        })
      );
  }

  confirmManualPayment(paymentId: string): Observable<any> {
    // Update to use direct endpoint without payload since ID is in URL
    return this.http.post<any>(`${this.apiUrl}/confirm-manual-payment/${paymentId}`, {}).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to confirm payment');
        }
        return response;
      }),
      catchError(error => {
        console.error('Manual payment confirmation failed:', error);
        throw new Error(error.error?.message || 'Failed to confirm payment');
      })
    );
  }

  getManualPayments(): Observable<ManualPayment[]> {
    return this.http.get<ManualPayment[]>(`${this.apiUrl}/manual-payments`)
      .pipe(
        catchError(error => {
          console.error('Failed to fetch manual payments:', error);
          throw new Error('Failed to fetch manual payments');
        })
      );
  }
}
