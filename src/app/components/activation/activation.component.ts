import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../../models/userProfile.model';
import { ProfileService } from '../../services/profile.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FileUploadService } from '../../services/file-upload.service';

@Component({
  selector: 'app-activation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="activation-container">
      <div class="activation-card">
        <h1>Account Activation</h1>
        <div class="status-section">
          <div class="status-badge pending">
            <i class="fas fa-clock"></i>
            Pending Verification
          </div>
          <p>Your account is currently pending verification. Our team will review your profile within 24-48 hours.</p>
        </div>
        <div class="requirements-section">
          <h2>Verification Requirements:</h2>
          <ul>
            <li [class.completed]="hasVerificationDocuments()">
              <i [class]="hasVerificationDocuments() ? 'fas fa-check' : 'fas fa-times'"></i>
              Upload verification documents
            </li>
            <li [class.completed]="hasPhysicalAttributes()">
              <i [class]="hasPhysicalAttributes() ? 'fas fa-check' : 'fas fa-times'"></i>
              Complete physical attributes
            </li>
            <li [class.completed]="hasServices()">
              <i [class]="hasServices() ? 'fas fa-check' : 'fas fa-times'"></i>
              Add your services
            </li>
            <li [class.completed]="hasRates()">
              <i [class]="hasRates() ? 'fas fa-check' : 'fas fa-times'"></i>
              Set your rates
            </li>
          </ul>
        </div>

        <!-- Document Upload Section -->
        <div class="document-upload-section" *ngIf="profile">
          <h3>Document Verification</h3>
          <div class="verification-stage">
            <div class="stage" [class.active]="profile.verificationStatus === 'pending'">
              <i class="fas fa-upload"></i>
              <span>Upload</span>
            </div>
            <div class="stage-connector"></div>
            <div class="stage" [class.active]="profile.verificationStatus === 'reviewing'">
              <i class="fas fa-search"></i>
              <span>Review</span>
            </div>
            <div class="stage-connector"></div>
            <div class="stage" [class.active]="profile.verificationStatus === 'verified'">
              <i class="fas fa-check-circle"></i>
              <span>Verified</span>
            </div>
          </div>

          <div class="document-inputs" *ngIf="profile.verificationStatus === 'pending'">
            <div class="document-input">
              <label>
                <i class="fas fa-id-card"></i>
                ID Front Side
                <input 
                  type="file" 
                  (change)="onFileSelected($event, 'front')"
                  accept="image/*"
                  [disabled]="uploading">
              </label>
              <span class="upload-hint" *ngIf="!frontUploaded">Upload a clear photo of your ID's front side</span>
              <span class="upload-success" *ngIf="frontUploaded"><i class="fas fa-check"></i> Front uploaded</span>
            </div>

            <div class="document-input">
              <label>
                <i class="fas fa-id-card"></i>
                ID Back Side
                <input 
                  type="file" 
                  (change)="onFileSelected($event, 'back')"
                  accept="image/*"
                  [disabled]="uploading">
              </label>
              <span class="upload-hint" *ngIf="!backUploaded">Upload a clear photo of your ID's back side</span>
              <span class="upload-success" *ngIf="backUploaded"><i class="fas fa-check"></i> Back uploaded</span>
            </div>
          </div>

          <div class="upload-status" *ngIf="uploading">
            <i class="fas fa-spinner fa-spin"></i> Uploading document...
          </div>

          <div class="verification-note">
            <i class="fas fa-info-circle"></i>
            <p>Please ensure your documents are:</p>
            <ul>
              <li>Clear and readable</li>
              <li>Not expired</li>
              <li>Shows your full name and photo</li>
              <li>Supported formats: JPG, PNG (max 5MB)</li>
            </ul>
          </div>
        </div>
        <div class="contact-section">
          <p>Need help? Contact our support team:</p>
          <!-- <a href="mailto:support@spanexx.com">support@spanexx.com</a> -->
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./activation.component.scss']
})
export class ActivationComponent implements OnInit {
  profile: UserProfile | null = null;
  uploading = false;
  frontUploaded = false;
  backUploaded = false;

  constructor(
    private profileService: ProfileService,
    private authService: AuthenticationService,
    private router: Router,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadProfile(user._id);
      }
    });
  }

  private loadProfile(id: string) {
    this.profileService.getProfileById(id).subscribe({
      next: (profile) => {
        this.profile = profile;
        if (profile.status !== 'pending') {
          this.router.navigate(['/profile', profile._id]);
        }
      },
      error: (error) => {
        console.error('Error loading profile:', error);
      }
    });
  }

  hasServices(): boolean {
    return !!(this.profile?.services?.included?.length || 
      Object.keys(this.profile?.services?.extra || {}).length);
  }

  hasRates(): boolean {
    return !!(
      Object.keys(this.profile?.rates?.incall || {}).length || 
      Object.keys(this.profile?.rates?.outcall || {}).length
    );
  }

  hasVerificationDocuments(): boolean {
    return !!this.profile?.verificationDocuments && this.profile.verificationDocuments.length >= 2;
  }

  hasPhysicalAttributes(): boolean {
    return !!this.profile?.physicalAttributes && 
           Object.keys(this.profile.physicalAttributes).length > 0;
  }

  onFileSelected(event: any, side: 'front' | 'back') {
    const file = event.target.files[0];
    if (!file || !this.profile) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }    this.uploading = true;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64Data = e.target.result;
      const contentType = file.type || 'image/jpeg'; // Ensure contentType has a default
      const filename = `verification_${side}.${file.name.split('.').pop() || 'jpg'}`;

      console.log('File details before upload:', {
        name: file.name,
        type: file.type,
        size: file.size,
        contentType: contentType
      });

      const uploadDocument = (retryCount = 3) => {
        this.fileUploadService.uploadVerificationDocument(
          base64Data,
          filename,
          contentType,
          this.profile!._id,
          side        ).subscribe({
          next: (response: { verificationStatus: string; verificationDocuments: any[] }) => {
            if (this.profile) {
              // Type check to ensure valid verification status
              const validStatus = ['pending', 'reviewing', 'verified', 'rejected'].includes(response.verificationStatus) 
                ? response.verificationStatus as 'pending' | 'reviewing' | 'verified' | 'rejected'
                : 'pending'; // Default to 'pending' if status is invalid
                
              this.profile.verificationStatus = validStatus;
              this.profile.verificationDocuments = response.verificationDocuments;
              // Manually trigger change detection if needed, though direct assignment should work
            }
            if (side === 'front') this.frontUploaded = true;
            if (side === 'back') this.backUploaded = true;
            this.uploading = false;
          },          error: (error: HttpErrorResponse) => {
            console.error('Error uploading document:', error);
            if (retryCount > 0) {
              console.log(`Retrying upload... (${3 - retryCount + 1}/3)`);
              uploadDocument(retryCount - 1);
            } else {
              const errorMessage = error.error?.message || 'Failed to upload document. Please try again later.';
              alert(`Upload failed: ${errorMessage}`);
              this.uploading = false;
            }
          }
        });
      };

      uploadDocument();
    };
    reader.readAsDataURL(file);
  }

  uploadProfilePicture(event: any) {
    const file = event.target.files[0];
    if (!file || !this.profile) return;
  
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
  
    this.uploading = true;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64Data = e.target.result;
      const contentType = file.type;
      const filename = `profile_picture.${file.name.split('.').pop()}`;
  
      const uploadPicture = (retryCount = 3) => {
        this.fileUploadService.uploadProfilePicture(
          base64Data,
          filename,
          contentType,
          this.profile!._id
        ).subscribe({
          next: (updatedProfile: UserProfile) => {
            this.profile = updatedProfile;
            alert('Profile picture uploaded successfully!');
            this.uploading = false;
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error uploading profile picture:', error);
            if (retryCount > 0) {
              console.log(`Retrying upload... (${3 - retryCount + 1}/3)`);
              uploadPicture(retryCount - 1);
            } else {
              alert('Failed to upload profile picture after multiple attempts. Please try again later.');
              this.uploading = false;
            }
          }
        });
      };
  
      uploadPicture();
    };
    reader.readAsDataURL(file);
  }
}
