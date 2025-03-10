import { Component, OnInit, OnDestroy } from '@angular/core';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentService } from '../../services/payment.service';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { ProfileService } from '../../services/profile.service';
import { CryptoPaymentService, BinancePaymentResponse } from '../../services/crypto-payment.service'; // Add BinancePaymentResponse

interface PaymentDetails {
  amount: number;
  currency: string;
  serviceDetails: {
    type: string;
    description: string;
  };
}

interface TestPaymentDetails {
  amount: number;
  testType: string;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, OnDestroy {
  stripe: any;
  card: any;
  error: string = '';
  processing = false;
  completed = false;
  plan: string | null = null;
  subscriptionDetails: any;
  private userId: string = '';
  paymentMethod: 'card' | 'crypto' = 'card';
  cryptoPaymentDetails: BinancePaymentResponse | null = null;  // Update type to use BinancePaymentResponse
  paymentTimeLeft: string = '';
  private paymentTimer: any;

  constructor(
    private paymentService: PaymentService,
    private cryptoPaymentService: CryptoPaymentService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService,
    private profileService: ProfileService  
  ) {}

  async ngOnInit() {
    this.stripe = await loadStripe(environment.stripePublishableKey);
    const elements = this.stripe.elements();
    
    this.card = elements.create('card');
    this.card.mount('#card-element');

    this.card.addEventListener('change', (event: any) => {
      if (event.error) {
        this.error = event.error.message;
      } else {
        this.error = '';
      }
    });

    // Get plan from query params
    this.route.queryParams.subscribe(params => {
      this.plan = params['plan'];
      if (params['clientSecret']) {
        this.confirmPayment(params['clientSecret']);
      }
      if (params['plan'] && params['amount'] && params['interval']) {
        this.subscriptionDetails = {
          plan: params['plan'],
          amount: parseFloat(params['amount']),
          interval: params['interval']
        };
        
        this.initializePayment();
      }
    });

    // Get current user ID
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = user._id;
      }
    });
  }

  private async confirmPayment(clientSecret: string) {
    try {
      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.card,
          billing_details: {
            // Add any billing details if available
          }
        }
      });
      
      if (result.error) {
        this.error = result.error.message;
        this.processing = false;
      } else if (result.paymentIntent.status === 'succeeded') {
        this.completed = true;
        // Refresh user profile to get updated level
        await this.authService.refreshCurrentUser();
        
        // Navigate to user's profile using stored userId
        setTimeout(() => {
          if (this.userId) {
            this.router.navigate(['/profile', this.userId]);
          } else {
            this.router.navigate(['/']);
          }
        }, 2000);
      }
    } catch (err: any) {
      this.error = err.message;
      this.processing = false;
    }
  }

  private async initializePayment() {
    if (!this.subscriptionDetails) return;

    this.processing = true;
    this.error = '';

    try {
      const { error: paymentMethodError, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.card
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      const serviceDetails = {
        type: this.route.snapshot.queryParams['type'] || 'profile',
        plan: this.subscriptionDetails.plan,
        interval: this.subscriptionDetails.interval
      };

      const result = await firstValueFrom(
        this.paymentService.createSubscription(
          this.subscriptionDetails.amount,
          'EUR',
          serviceDetails,
          this.subscriptionDetails.interval,
          paymentMethod.id
        )
      );

      if (result.clientSecret) {
        const { error: confirmError } = await this.stripe.confirmCardPayment(
          result.clientSecret,
          {
            payment_method: paymentMethod.id
          }
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        this.completed = true;

        // Update subscription status based on type
        if (serviceDetails.type === 'video') {
          // Calculate expiry date based on interval
          const expiresAt = new Date();
          if (this.subscriptionDetails.interval === 'year') {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          } else {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          }

          await firstValueFrom(
            this.profileService.updateField('videoSubscription', {
              isSubscribed: true,
              subscribedAt: new Date(),
              expiresAt: expiresAt
            })
          );
        } else {
          // Handle regular profile subscription
          const profileLevel = this.subscriptionDetails.plan.toLowerCase();
          await firstValueFrom(
            this.profileService.updateField('profileLevel', profileLevel)
          );
        }

        // Wait for a moment then redirect
        setTimeout(() => {
          if (this.userId) {
            this.router.navigate(['/profile', this.userId]);
          } else {
            this.router.navigate(['/']);
          }
        }, 2000);
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to process payment';
      this.processing = false;
    }
  }

  private initializeCryptoPayment() {
    if (!this.subscriptionDetails) return;

    this.processing = true;
    const orderId = `ORDER_${Date.now()}`;

    this.cryptoPaymentService.createPayment(
      this.subscriptionDetails.amount,
      orderId,
      `${this.subscriptionDetails.plan} Plan Subscription`
    ).subscribe({
      next: (response) => {
        this.cryptoPaymentDetails = response;  // Now the types match
        this.startPaymentTimer(response.expireTime);
        this.processing = false;

        // Start polling for payment status
        this.startPaymentStatusCheck(orderId);
      },
      error: (err) => {
        this.error = 'Failed to initialize crypto payment: ' + err.message;
        this.processing = false;
      }
    });
  }

  private startPaymentTimer(expireTime: number) {
    const endTime = expireTime * 1000; // Convert to milliseconds
    
    this.paymentTimer = setInterval(() => {
      const now = Date.now();
      const timeLeft = endTime - now;
      
      if (timeLeft <= 0) {
        clearInterval(this.paymentTimer);
        this.paymentTimeLeft = 'Expired';
        return;
      }
      
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      this.paymentTimeLeft = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  private startPaymentStatusCheck(orderId: string) {
    const checkInterval = setInterval(() => {
      this.cryptoPaymentService.checkPaymentStatus(orderId).subscribe({
        next: (response) => {
          if (response.status === 'PAID') {
            clearInterval(checkInterval);
            this.completed = true;
            this.handleSuccessfulPayment();
          }
        },
        error: (err) => {
          console.error('Payment status check failed:', err);
        }
      });
    }, 5000); // Check every 5 seconds
  }

  private handleSuccessfulPayment() {
    // Update profile level based on subscription plan
    const profileLevel = this.subscriptionDetails.plan.toLowerCase();
    firstValueFrom(this.profileService.updateField('profileLevel', profileLevel))
      .then(() => {
        setTimeout(() => {
          if (this.userId) {
            this.router.navigate(['/profile', this.userId]);
          } else {
            this.router.navigate(['/']);
          }
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to update profile level:', err);
      });
  }

  ngOnDestroy() {
    if (this.paymentTimer) {
      clearInterval(this.paymentTimer);
    }
  }

  async handleSubmit() {
    if (this.paymentMethod === 'crypto') {
      this.initializeCryptoPayment();
      return;
    }

    if (!this.card || this.processing) {
      return;
    }

    this.processing = true;
    this.error = '';

    try {
      if (this.subscriptionDetails) {
        await this.initializePayment();
      } else {
        await this.handlePayment();
      }
    } catch (err: any) {
      this.error = err.message || 'An error occurred while processing your payment';
      this.processing = false;
    }
  }

  async handlePayment(testDetails?: TestPaymentDetails) {
    this.processing = true;
    this.error = '';
    
    try {
      const paymentDetails: PaymentDetails = testDetails ? {
        amount: testDetails.amount,
        currency: 'EUR',
        serviceDetails: {
          type: testDetails.testType,
          description: `Test payment for ${testDetails.testType}`
        }
      } : {
        amount: 0,
        currency: 'EUR',
        serviceDetails: {
          type: 'Regular Payment',
          description: 'Standard payment processing'
        }
      };

      console.log('Initiating payment:', paymentDetails);
      
      const result = await firstValueFrom(
        this.paymentService.createPaymentIntent(
          paymentDetails.amount,
          paymentDetails.currency,
          paymentDetails.serviceDetails
        )
      );

      if (!result) {
        throw new Error('Failed to create payment intent');
      }

      console.log('Payment intent created:', result);

      const paymentResult = await this.stripe.confirmCardPayment(result.clientSecret, {
        payment_method: {
          card: this.card
        }
      });

      if (paymentResult.error) {
        console.error('Payment confirmation error:', paymentResult.error);
        this.error = paymentResult.error.message;
      } else if (paymentResult.paymentIntent.status === 'succeeded') {
        this.completed = true;
        // Use userId for navigation here too
        setTimeout(() => {
          if (this.userId) {
            this.router.navigate(['/profile', this.userId]);
          } else {
            this.router.navigate(['/']);
          }
        }, 2000);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      this.error = err.message || 'Payment failed. Please try again.';
    }

    this.processing = false;
  }

  testPayment(amount: number, testType: 'Success' | 'Auth' | 'Decline') {
    this.handlePayment({ 
      amount, 
      testType: `Test ${testType} Payment` 
    });
  }

  selectPaymentMethod(method: 'card' | 'crypto') {
    this.paymentMethod = method;
    
    // Clear any previous errors
    this.error = '';
    
    if (method === 'crypto') {
      // Initialize crypto payment immediately
      this.initializeCryptoPayment();
    } else {
      // Reset crypto payment details
      this.cryptoPaymentDetails = null;
      if (this.paymentTimer) {
        clearInterval(this.paymentTimer);
      }
      
      // Initialize card payment element
      if (!this.card) {
        const elements = this.stripe.elements();
        this.card = elements.create('card');
        this.card.mount('#card-element');
      }
    }
  }
}
