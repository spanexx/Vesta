import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';
import { Router } from '@angular/router';

interface PricingTier {
  id: string;
  name: string;
  monthlyPrice?: number; // Make optional for free tier
  yearlyPrice?: number;  // Make optional for free tier
  features: string[];
  popular?: boolean;
  free?: boolean;       // Add this to identify free tier
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss']
})
export class PricingComponent {
  isYearly = false;
  selectedTier: PricingTier | null = null;
  processing = false;
  error = '';

  pricingTiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      features: [
        'Basic profile listing',
        'Up to 3 photos',
        'Basic profile customization',
        'Community access'
      ],
      free: true
    },
    {
      id: 'standard',
      name: 'Standard',
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,  // Save ~$60/year
      features: [
        'Basic profile listing',
        'Up to 5 photos',
        'Email support',
        'Basic analytics'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,  // Save ~$100/year
      features: [
        'Priority listing',
        'Up to 20 photos',
        'Video uploads',
        'Priority support',
        'Advanced analytics',
        'Featured profile boost'
      ],
      popular: true
    },
    {
      id: 'video',
      name: 'Video Creator',
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      features: [
        'Upload 1 HD video',
        'Video hosting',
        'Video analytics',
        'Update video monthly',
        'Priority support',
        'Verified creator badge'
      ]
    },
    {
      id: 'vip',
      name: 'VIP',
      monthlyPrice: 99.99,
      yearlyPrice: 999.99,  // Save ~$200/year
      features: [
        'Top listing placement',
        'Unlimited photos',
        'Unlimited videos',
        '24/7 VIP support',
        'Real-time analytics',
        'Premium profile badge',
        'Custom profile URL',
        'Background check verification'
      ]
    }
  ];

  constructor(
    private paymentService: PaymentService,
    private router: Router
  ) {}

  getPrice(tier: PricingTier): number {
    if (tier.free) return 0;
    return this.isYearly ? tier.yearlyPrice! : tier.monthlyPrice!;
  }

  getSavings(tier: PricingTier): number {
    if (!this.isYearly) return 0;
    return (tier.monthlyPrice! * 12) - tier.yearlyPrice!;
  }

  async subscribe(tier: PricingTier) {
    if (tier.free) {
      // For free tier, just redirect to profile completion
      this.router.navigate(['/profile-settings']);
      return;
    }

    // For paid tiers, proceed with payment
    this.router.navigate(['/payment'], {
      queryParams: {
        plan: tier.name.toLowerCase(),
        amount: this.getPrice(tier),
        interval: this.isYearly ? 'year' : 'month',
        type: tier.id === 'video' ? 'video' : 'profile'
      }
    });
  }
}
