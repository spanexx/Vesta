import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { FileUploadService } from '../../services/file-upload.service';
import { ProfileService } from '../../services/profile.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-manual-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manual-payment.component.html',
  styleUrls: ['./manual-payment.component.scss']
})
export class ManualPaymentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private usernameInput$ = new Subject<string>();
  private emailInput$ = new Subject<string>();

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

  // Autocomplete properties
  usernameSuggestions: string[] = [];
  emailSuggestions: string[] = [];
  showUsernameSuggestions = false;
  showEmailSuggestions = false;
  filteredUsernameSuggestions: string[] = [];
  filteredEmailSuggestions: string[] = [];
  allUsernames: string[] = [];
  allEmails: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private fileUploadService: FileUploadService,
    private profileService: ProfileService
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

    // Load profile suggestions for autocomplete
    this.loadProfileSuggestions();

    // Set up debounced search for username
    this.usernameInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.filterUsernameSuggestions(term));

    // Set up debounced search for email
    this.emailInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.filterEmailSuggestions(term));
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
    } finally {      this.processing = false;
    }
  }

  // Autocomplete methods
  loadProfileSuggestions() {
    this.profileService.getProfileSuggestions().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (suggestions) => {
        this.allUsernames = suggestions.usernames;
        this.allEmails = suggestions.emails;
      },
      error: (error) => {
        console.error('Failed to load profile suggestions:', error);
      }
    });
  }
  onUsernameInput(event: any) {
    const value = event.target.value;
    this.username = value; // Keep this for consistency, but ngModel should handle it
    this.usernameInput$.next(value);
  }
  onEmailInput(event: any) {
    const value = event.target.value;
    this.email = value; // Keep this for consistency, but ngModel should handle it
    this.emailInput$.next(value);
  }

  onUsernameFocus() {
    if (this.username && this.username.trim().length > 0) {
      this.filterUsernameSuggestions(this.username);
    }
  }

  onEmailFocus() {
    if (this.email && this.email.trim().length > 0) {
      this.filterEmailSuggestions(this.email);
    }
  }

  filterUsernameSuggestions(term: string) {
    if (!term || term.length < 1) {
      this.filteredUsernameSuggestions = [];
      this.showUsernameSuggestions = false;
      return;
    }

    // Case-sensitive filtering for usernames since they are case-sensitive
    this.filteredUsernameSuggestions = this.allUsernames
      .filter(username => username.includes(term))
      .slice(0, 10); // Limit to 10 suggestions

    this.showUsernameSuggestions = this.filteredUsernameSuggestions.length > 0;
  }

  filterEmailSuggestions(term: string) {
    if (!term || term.length < 1) {
      this.filteredEmailSuggestions = [];
      this.showEmailSuggestions = false;
      return;
    }

    // Case-insensitive filtering for emails
    this.filteredEmailSuggestions = this.allEmails
      .filter(email => email.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 10); // Limit to 10 suggestions

    this.showEmailSuggestions = this.filteredEmailSuggestions.length > 0;
  }
  selectUsernameSuggestion(username: string) {
    this.username = username;
    this.showUsernameSuggestions = false;
    this.filteredUsernameSuggestions = [];
    
    // Trigger the input event to ensure the form recognizes the change
    const event = new Event('input', { bubbles: true });
    setTimeout(() => {
      const usernameInput = document.getElementById('username') as HTMLInputElement;
      if (usernameInput) {
        usernameInput.dispatchEvent(event);
      }
    }, 0);
  }

  selectEmailSuggestion(email: string) {
    this.email = email;
    this.showEmailSuggestions = false;
    this.filteredEmailSuggestions = [];
    
    // Trigger the input event to ensure the form recognizes the change
    const event = new Event('input', { bubbles: true });
    setTimeout(() => {
      const emailInput = document.getElementById('email') as HTMLInputElement;
      if (emailInput) {
        emailInput.dispatchEvent(event);
      }
    }, 0);
  }

  hideUsernameSuggestions() {
    // Small delay to allow clicking on suggestions
    setTimeout(() => {
      this.showUsernameSuggestions = false;
    }, 200);
  }

  hideEmailSuggestions() {
    // Small delay to allow clicking on suggestions
    setTimeout(() => {
      this.showEmailSuggestions = false;
    }, 200);
  }
}