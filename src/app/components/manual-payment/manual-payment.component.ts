import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { FileUploadService } from '../../services/file-upload.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-manual-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manual-payment.component.html',
  styleUrls: ['./manual-payment.component.scss']
})
export class ManualPaymentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  paymentMethod: 'crypto' | 'giftcard' | 'paysafecard' = 'crypto';
  subscriptionDetails: any;
  imageFile: File | null = null;
  processing = false;
  error = '';
  cryptoAddresses = {
    BTC: 'your-btc-address',
    ETH: 'your-eth-address',
    USDT: 'your-usdt-address'
  };
  username: string = '';
  email: string = '';
  imageFileId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['plan'] && params['amount'] && params['interval']) {
        this.subscriptionDetails = {
          plan: params['plan'],
          amount: params['amount'],
          interval: params['interval']
        };
      } else {
        this.router.navigate(['/pricing']);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      this.imageFile = file;
      this.error = '';
      
      // Read and upload file
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        this.fileUploadService.uploadPaymentSlip(base64Data, file.name, file.type)
          .subscribe({
            next: (response) => {
              this.imageFileId = response.fileId;
            },
            error: (error) => {
              this.error = 'Failed to upload image';
              console.error('Upload error:', error);
            }
          });
      };
      reader.readAsDataURL(file);
    } else {
      this.error = 'Please select a valid image file (JPEG or PNG)';
    }
  }

  async submitManualPayment() {
    if (this.processing || !this.imageFileId) return;
    this.processing = true;
    this.error = '';

    try {
      const manualPaymentData = {
         plan: this.subscriptionDetails.plan,
         amount: this.subscriptionDetails.amount,
         interval: this.subscriptionDetails.interval,
         username: this.username,
         email: this.email,
         image: this.imageFileId // Now using the file ID
      };

      await this.paymentService.updateAdminManualPayment({ manualPaymentData }).toPromise();

      // Show success message and redirect
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
    } catch (err: any) {
      this.error = err.message || 'Failed to update manual payment data';
    } finally {
      this.processing = false;
    }
  }
}