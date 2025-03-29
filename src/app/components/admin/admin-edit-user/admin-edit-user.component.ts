import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserProfile } from '../../../models/userProfile.model';
import { FileUploadService } from '../../../services/file-upload.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-admin-edit-user',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-edit-user.component.html',
  styleUrls: ['./admin-edit-user.component.css']
})
export class AdminEditUserComponent implements OnInit, OnDestroy {
  userForm: FormGroup;
  isLoading = false;
  isSaving = false;
  error = '';
  userId!: string;
  profile: UserProfile | null = null;
  previewUrl: string | null = null;
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private fileUploadService: FileUploadService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      username: [''],
      email: [''],
      birthdate: [''],
      verified: [false],
      status: [''],
      role: [[]],
      profileLevel: [''],
      verificationStatus: [''],
      moderationFlags: this.fb.group({
        contentWarnings: [''],
        reviewerNotes: [''],
        lastReviewed: [new Date()]
      }),
      services: this.fb.group({
        included: [[]],
        extra: this.fb.group({})
      }),
      rates: this.fb.group({
        incall: this.fb.group({}),
        outcall: this.fb.group({})
      }),
      physicalAttributes: this.fb.group({
        gender: [''],
        height: [null],
        weight: [null],
        ethnicity: [''],
        bustSize: [''],
        bustType: [''],
        pubicHair: [''],
        tattoos: [false],
        piercings: [false]
      }),
      availableToMeet: this.fb.group({
        meetingWith: [[]],
        available24_7: [false],
        advanceBooking: [false]
      }),
      contact: this.fb.group({
        phone: [''],
        whatsapp: [''],
        country: [''],
        city: [''],
        location: this.fb.group({
          type: ['Point'],
          coordinates: [[]]
        })
      }),
      subscription: this.fb.group({
        active: [false],
        plan: [''],
        startDate: [null],
        endDate: [null]
      }),
      videoSubscription: this.fb.group({
        active: [false],
        plan: [''],
        startDate: [null],
        endDate: [null]
      })
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.params['userId'];
    if (this.userId) {
      this.loadUser();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadUser(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.subscriptions.add(
      this.adminService.getAllProfiles().pipe(take(1)).subscribe({
        next: (users) => {
          const user = users.find(u => u._id === this.userId);
          if (user) {
            this.initializeForm(user);
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load user';
          this.isLoading = false;
        }
      })
    );
  }

  getMediaUrl(fileId: string): string {
    // Add null check
    if (!fileId) {
      return '';
    }
    return this.fileUploadService.getMediaUrl(fileId);
  }

  openPreview(fileId: string): void {
    // Add null check
    if (!fileId) {
      return;
    }
    this.previewUrl = this.getMediaUrl(fileId);
  }

  closePreview(): void {
    this.previewUrl = null;
  }

  onSubmit(): void {
    if (this.userForm.invalid || this.isSaving || this.isLoading) return;

    // Show confirmation dialog with changes summary
    const changes = this.getChangedFields();
    if (Object.keys(changes).length === 0) {
      this.error = 'No changes to save';
      return;
    }

    const message = this.formatChangesMessage(changes);
    if (!confirm(`Are you sure you want to make the following changes?\n\n${message}`)) {
      return;
    }

    this.isSaving = true;
    this.subscriptions.add(
      this.adminService.updateUserProfile(this.userId, changes).subscribe({
        next: () => {
          this.router.navigate(['/admin/users']);
        },
        error: (error) => {
          this.error = error.message || 'Failed to update user';
          this.isSaving = false;
        }
      })
    );
  }

  private getChangedFields(): any {
    const changes: any = {};
    const currentValues = this.userForm.getRawValue();
    const original = this.profile;

    // Helper function to check if objects are different
    const isDifferent = (a: any, b: any) => JSON.stringify(a) !== JSON.stringify(b);

    // Check each editable field for changes
    if (currentValues.status !== original?.status) changes.status = currentValues.status;
    if (currentValues.verified !== original?.verified) changes.verified = currentValues.verified;
    if (currentValues.role && isDifferent(currentValues.role, original?.role)) changes.role = currentValues.role;
    if (currentValues.profileLevel !== original?.profileLevel) changes.profileLevel = currentValues.profileLevel;
    if (currentValues.verificationStatus !== original?.verificationStatus) changes.verificationStatus = currentValues.verificationStatus;
    
    // Check nested objects
    if (isDifferent(currentValues.physicalAttributes, original?.physicalAttributes)) {
      changes.physicalAttributes = currentValues.physicalAttributes;
    }
    if (isDifferent(currentValues.services, original?.services)) {
      changes.services = currentValues.services;
    }
    if (isDifferent(currentValues.rates, original?.rates)) {
      changes.rates = currentValues.rates;
    }
    if (isDifferent(currentValues.availableToMeet, original?.availableToMeet)) {
      changes.availableToMeet = currentValues.availableToMeet;
    }
    if (isDifferent(currentValues.contact, original?.contact)) {
      changes.contact = currentValues.contact;
    }
    if (isDifferent(currentValues.subscription, original?.subscription)) {
      changes.subscription = currentValues.subscription;
    }
    if (isDifferent(currentValues.videoSubscription, original?.videoSubscription)) {
      changes.videoSubscription = currentValues.videoSubscription;
    }
    if (isDifferent(currentValues.moderationFlags, original?.moderationFlags)) {
      changes.moderationFlags = currentValues.moderationFlags;
    }

    return changes;
  }

  private formatChangesMessage(changes: any): string {
    return Object.entries(changes)
      .map(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        return `${formattedKey}: ${this.profile?.[key as keyof UserProfile]} → ${value}`;
      })
      .join('\n');
  }

  onCancel(): void {
    this.router.navigate(['/admin/users']);
  }

  // Helper method to initialize form with user data
  private initializeForm(user: UserProfile): void {
    // Format the date to YYYY-MM-DD
    const birthdate = user.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : '';

    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      birthdate: birthdate,
      verified: user.verified,
      status: user.status,
      role: user.role,
      profileLevel: user.profileLevel,
      verificationStatus: user.verificationStatus,
      services: user.services || { included: [], extra: {} },
      rates: user.rates || { incall: {}, outcall: {} },
      physicalAttributes: user.physicalAttributes || {},
      availableToMeet: user.availableToMeet || {},
      contact: user.contact || {},
      subscription: {
        active: user.subscription?.status === 'active',
        plan: user.profileLevel || '',
        startDate: user.subscription?.startDate ? new Date(user.subscription.startDate).toISOString().split('T')[0] : '',
        endDate: user.subscription?.currentPeriodEnd ? new Date(user.subscription.currentPeriodEnd).toISOString().split('T')[0] : ''
      },
      moderationFlags: {
        contentWarnings: user.moderationFlags?.contentWarnings || '',
        reviewerNotes: user.moderationFlags?.reviewerNotes || '',
        lastReviewed: user.moderationFlags?.lastReviewed ? new Date(user.moderationFlags.lastReviewed).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }
    });
  }
}
