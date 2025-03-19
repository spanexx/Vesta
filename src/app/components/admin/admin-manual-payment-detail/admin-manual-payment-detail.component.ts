import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PaymentService, ManualPayment } from '../../../services/payment.service';
import { firstValueFrom } from 'rxjs';  
import { FileUploadService } from '../../../services/file-upload.service';

@Component({
  selector: 'app-admin-manual-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-manual-payment-detail.component.html',
  styleUrls: ['./admin-manual-payment-detail.component.css']
})
export class AdminManualPaymentDetailComponent implements OnInit {
  paymentId: string = '';
  payment: ManualPayment | null = null;
  loading: boolean = true;
  error: string = '';
  showImageModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    this.paymentId = this.route.snapshot.params['id'];
    this.loadPaymentDetails();
  }

  loadPaymentDetails(): void {
    this.paymentService.getManualPayments().subscribe({
      next: (payments) => {
        console.log('Loaded payments:', payments);
        this.payment = payments.find(p => p._id === this.paymentId) || null;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load payment details';
        this.loading = false;
        console.error('Error loading payment:', error);
      }
    });
  }

  async confirmPayment(): Promise<void> {
    if (!this.payment) return;

    try {
      this.error = '';
      // Call the service and handle the response
      const response = await firstValueFrom(this.paymentService.confirmManualPayment(this.paymentId));
      if (response.success) {
        // Navigate back to list on success
        this.router.navigate(['/admin/manual-payers']);
      } else {
        this.error = response.message || 'Failed to confirm payment';
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to confirm payment';
      console.error('Payment confirmation error:', err);
    }
  }

  getMediaUrl(fileId: string): string {
    console.log('Getting media URL for file:', fileId);
    return this.fileUploadService.getMediaUrl(fileId);
  }

  toggleImageModal(): void {
    this.showImageModal = !this.showImageModal;
  }
}
