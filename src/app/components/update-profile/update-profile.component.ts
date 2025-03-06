import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../models/userProfile.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-update-profile',
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class UpdateProfileComponent implements OnInit {
  profileForm: FormGroup;
  isSubmitting = false;
  submitError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthenticationService
  ) {
    this.profileForm = this.createProfileForm();
  }

  ngOnInit(): void {
    // Get current user's data and patch form
    this.authService.currentUser$.subscribe((user: UserProfile | null) => {
      if (user) {
        this.profileForm.patchValue({
          username: user.username || '',
          email: user.email || '',
          birthdate: user.birthdate ? new Date(user.birthdate) : null
        });
      }
    });

    // Fetch fresh data from server
    this.authService.getCurrentUser().pipe(
      catchError(error => {
        console.error('Error loading profile:', error);
        return of(null);
      })
    ).subscribe(user => {
      if (user) {
        this.profileForm.patchValue({
          username: user.username || '',
          email: user.email || '',
          birthdate: user.birthdate ? new Date(user.birthdate) : null
        });
      }
    });
  }

  private createProfileForm(): FormGroup {
    return this.fb.group({
      // Basic Info
      username: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      birthdate: [{ value: '', disabled: true }],
      fullName: ['', [Validators.required]],
      bio: ['', [Validators.required, Validators.minLength(50)]],
      role: ['onenight'],
      accountLevel: ['regular'],
      profileLevel: ['standard'],

      // Services and Rates
      services: [[]],
      rates: this.fb.group({
        incall: this.fb.group({
          '30 minutes': [0, [Validators.min(0)]],
          '1 hour': [0, [Validators.min(0)]]
        }),
        outcall: this.fb.group({
          '30 minutes': [0, [Validators.min(0)]],
          '1 hour': [0, [Validators.min(0)]]
        })
      }),

      // Physical Attributes
      physicalAttributes: this.fb.group({
        gender: ['', [Validators.required]],
        height: [null, [Validators.min(0)]],
        weight: [null, [Validators.min(0)]],
        ethnicity: [''],
        bustSize: [''],
        bustType: [''],
        pubicHair: [''],
        tattoos: [false],
        piercings: [false]
      }),

      // Availability
      availableToMeet: this.fb.group({
        meetingWith: [[]],
        available24_7: [false],
        advanceBooking: [false]
      }),
      workingTime: [''],
      availability: this.fb.group({
        schedule: this.fb.group({
          Monday: [true],
          Tuesday: [true],
          Wednesday: [true],
          Thursday: [true],
          Friday: [true],
          Saturday: [false],
          Sunday: [false]
        }),
        timezone: ['UTC']
      }),

      // Contact Information
      contact: this.fb.group({
        phone: ['', [Validators.required]],
        country: ['', [Validators.required]],
        city: ['', [Validators.required]],
        location: this.fb.group({
          type: ['Point'],
          coordinates: [[0, 0]]
        })
      }),

      // Emergency Contact
      emergencyContact: this.fb.group({
        name: [''],
        phoneNumber: [''],
        relationship: ['']
      }),

      // Media
      images: [[]],
      videos: [[]],
      verificationDocuments: [[]],

      // Terms and Verification
      termsAccepted: [false, [Validators.requiredTrue]],
      verificationStatus: ['pending'],
      moderationFlags: this.fb.group({
        contentWarnings: [0],
        lastReviewed: [null],
        reviewerNotes: ['']
      })
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isSubmitting = true;
      this.submitError = null;

      // Create profile data object matching the backend expected structure
      const profileData: Partial<UserProfile> = {
        ...this.profileForm.getRawValue(),
        // Ensure these fields are not included in the update
        email: undefined,
        username: undefined,
        birthdate: undefined
      };

      this.profileService.updateProfile(profileData)
        .pipe(
          catchError(error => {
            this.submitError = error.message || 'Failed to update profile';
            this.isSubmitting = false;
            return of(null);
          })
        )
        .subscribe(response => {
          this.isSubmitting = false;
          if (response) {
            // Update form with new values
            this.profileForm.patchValue(response);
            console.log('Profile updated successfully');
          }
        });
    }
  }
}
