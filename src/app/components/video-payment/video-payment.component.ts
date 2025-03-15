import { Component } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { AuthenticationService } from '../../services/authentication.service';

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
  selector: 'app-video-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-payment.component.html',
  styleUrl: './video-payment.component.css'
})
export class VideoPaymentComponent {
 isYearly = false;
  selectedTier: PricingTier | null = null;
  processing = false;
  error = '';

  pricingTiers: PricingTier[] = [

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

  ];

  constructor(
    private paymentService: PaymentService,
    private router: Router,
    private profileService: ProfileService,
    private authService: AuthenticationService
  ) {}

  ngOnInit() {
    // Remove profile level check since it's now handled by guard
  }

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
