import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentService, ManualPayment } from '../../../services/payment.service';

@Component({
  selector: 'app-admin-manual-payers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-manual-payers.component.html',
  styleUrls: ['./admin-manual-payers.component.css']
})
export class AdminManualPayersComponent implements OnInit {
  manualPayments: ManualPayment[] = [];
  error: string = '';

  constructor(
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadManualPayments();
  }

  loadManualPayments(): void {
    this.paymentService.getManualPayments()
      .subscribe({
        next: (payments) => {
          this.manualPayments = payments;
        },
        error: (err) => {
          this.error = 'Failed to load manual payments';
          console.error('Error loading manual payments:', err);
        }
      });
  }

  verifyPayment(paymentId: string): void {
    // Remove 'verify' from the route - just navigate to the ID
    this.router.navigate(['/admin/manual-payers', paymentId]);
  }
}
