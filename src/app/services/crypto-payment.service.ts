import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as crypto from 'crypto-js';
import { environment } from '../environments/environment';

export interface BinancePaymentRequest {
  merchantTradeNo: string;
  orderAmount: number;
  currency: string;
  goods: {
    goodsType: '01' | '02'; // 01: Physical Goods, 02: Virtual Goods
    goodsCategory: string;
    referenceGoodsId: string;
    goodsName: string;
  };
}

export interface BinancePaymentResponse {
  status: string;
  prepayId: string;
  terminalType: string;
  checkoutUrl: string;
  qrcodeLink: string;
  deeplink: string;
  expireTime: number;
  orderAmount: number; // Add this field
}

@Injectable({
  providedIn: 'root'
})
export class CryptoPaymentService {
  private apiUrl = environment.binancePay.apiUrl;
  private merchantId = environment.binancePay.merchantId;
  private apiKey = environment.binancePay.apiKey;
  private secretKey = environment.binancePay.secretKey;

  constructor(private http: HttpClient) {}

  private generateNonce(): string {
    return Math.random().toString(36).substring(7);
  }

  private generateTimestamp(): number {
    return Date.now();
  }

  private generateSignature(payload: string, timestamp: number, nonce: string): string {
    const signString = timestamp + '\n' + nonce + '\n' + payload + '\n';
    return crypto.HmacSHA512(signString, this.secretKey).toString();
  }

  createPayment(amount: number, orderId: string, description: string): Observable<BinancePaymentResponse> {
    const timestamp = this.generateTimestamp();
    const nonce = this.generateNonce();

    const payload: BinancePaymentRequest = {
      merchantTradeNo: orderId,
      orderAmount: amount,
      currency: 'USDT',
      goods: {
        goodsType: '02',
        goodsCategory: 'Services',
        referenceGoodsId: orderId,
        goodsName: description
      }
    };

    const signature = this.generateSignature(JSON.stringify(payload), timestamp, nonce);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'BinancePay-Timestamp': timestamp.toString(),
      'BinancePay-Nonce': nonce,
      'BinancePay-Certificate-SN': this.apiKey,
      'BinancePay-Signature': signature
    });

    return this.http.post<BinancePaymentResponse>(
      `${this.apiUrl}/binancepay/openapi/order`, 
      payload, 
      { headers }
    );
  }

  checkPaymentStatus(orderId: string): Observable<any> {
    const timestamp = this.generateTimestamp();
    const nonce = this.generateNonce();
    
    const payload = {
      merchantTradeNo: orderId
    };

    const signature = this.generateSignature(JSON.stringify(payload), timestamp, nonce);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'BinancePay-Timestamp': timestamp.toString(),
      'BinancePay-Nonce': nonce,
      'BinancePay-Certificate-SN': this.apiKey,
      'BinancePay-Signature': signature
    });

    return this.http.post(
      `${this.apiUrl}/binancepay/openapi/order/query`,
      payload,
      { headers }
    );
  }
}
