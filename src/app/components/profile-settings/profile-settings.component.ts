import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../models/userProfile.model';
import { AuthenticationService } from '../../services/authentication.service';
import { FileUploadService } from '../../services/file-upload.service';
import { Role, RoleOption } from '../../models/role.model';
import { lastValueFrom, map } from 'rxjs';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css']
})
export class ProfileSettingsComponent implements OnInit {
  profile: UserProfile | null = null;
  isLoading = false;
  error = '';
  userId = '';
  profilePicturePreview: string | null = null;
  selectedFiles: File[] = [];
  selectedVideos: File[] = [];
  availableServices = [
    // Basic Services
    'Classic vaginal sex', 'Sex Toys', 'Striptease', 'Uniforms', '69 position', 
    'Cum in face', 'Cum in mouth', 'Cum on body', 'Deepthroat', 'Domination', 
    'Erotic massage', 'Erotic Photos', 'Foot fetish', 'French kissing', 
    'Golden shower give', 'Group sex', 'Oral without condom', 'With 2 men',
    // Pornstar Services
    'Video Recording', 'Photo Shooting', 'Live Cam Show', 'Adult Film Production',
    'Private Show', 'Professional Photos', 'Explicit Content Creation',
    // Mistress Services
    'BDSM', 'Role Play', 'Spanking', 'Bondage', 'Fetish', 'Slave Training',
    'Discipline', 'Humiliation', 'Rope Play', 'Wax Play',
    // Girlfriend Experience
    'Dinner Date', 'Overnight Stay', 'Weekend Trip', 'Social Events',
    'Romantic Evening', 'Cuddling', 'Dating', 'Travel Companion',
    'Dancing', 'Shopping Together'
  ];
  availableRoles: RoleOption[] = [
    { value: 'girlfriend', label: 'Girlfriend' },
    { value: 'wife', label: 'Wife' },
    { value: 'mistress', label: 'Mistress' },
    { value: 'pornstar', label: 'Pornstar' },
    { value: 'onenight', label: 'One Night' }
  ];

  constructor(
    private profileService: ProfileService,
    private authService: AuthenticationService,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit() {
    this.loadProfile();
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = user._id;
      }
    });
  }

  initializeProfile(profile: UserProfile): UserProfile {
    return {
      ...profile,
      physicalAttributes: {
        gender: profile.physicalAttributes?.gender || 'female',
        height: profile.physicalAttributes?.height || 165,
        weight: profile.physicalAttributes?.weight || 55,
        ethnicity: profile.physicalAttributes?.ethnicity || 'Other',
        bustSize: profile.physicalAttributes?.bustSize || '',
        bustType: profile.physicalAttributes?.bustType || 'Natural',
        pubicHair: profile.physicalAttributes?.pubicHair || 'Shaved',
        tattoos: profile.physicalAttributes?.tattoos || false,
        piercings: profile.physicalAttributes?.piercings || false
      }
    };
  }

  private loadProfile() {
    this.isLoading = true;
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.profileService.getProfileById(user._id).subscribe({
          next: (profile) => {
            this.profile = this.initializeProfile(profile);
            this.isLoading = false;
          },
          error: (error) => {
            this.error = 'Failed to load profile';
            this.isLoading = false;
          }
        });
      }
    });
  }

  canUpload(): boolean {
    return this.profile?.status !== 'pending';
  }

  onProfilePictureSelected(event: Event) {
    if (!this.canUpload()) {
      this.error = 'Cannot upload while account is pending verification';
      return;
    }
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePicturePreview = reader.result as string;
        this.updateProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onImagesSelected(event: Event) {
    if (!this.canUpload()) {
      this.error = 'Cannot upload while account is pending verification';
      return;
    }
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      const images: string[] = [];
      let loadedFiles = 0;

      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          images.push(reader.result as string);
          loadedFiles++;
          
          if (loadedFiles === files.length) {
            this.updateImages(images);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  onVideosSelected(event: Event) {
    if (!this.canUpload()) {
      this.error = 'Cannot upload while account is pending verification';
      return;
    }
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      const videos: string[] = [];
      let loadedFiles = 0;

      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          videos.push(reader.result as string);
          loadedFiles++;
          
          if (loadedFiles === files.length) {
            this.updateVideos(videos);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  updateProfilePicture(profilePicture: string) {
    this.isLoading = true;
    this.profileService.updateProfilePicture(this.userId, profilePicture)
      .subscribe({
        next: (updatedProfile) => {
          this.profile = updatedProfile;
          this.isLoading = false;
          this.error = '';
        },
        error: (err) => {
          this.isLoading = false;
          this.error = 'Failed to update profile picture';
          console.error(err);
        }
      });
  }

  updateImages(images: string[]) {
    this.isLoading = true;
    this.profileService.updateImages(this.userId, images)
      .subscribe({
        next: (updatedProfile) => {
          console.log('Updated profile:', this.userId, images);
          this.profile = updatedProfile;
          this.isLoading = false;
          this.error = '';
        },
        error: (err) => {
          this.isLoading = false;
          this.error = 'Failed to update images';
          console.error(err);
        }
      });
  }

  updateVideos(videos: string[]) {
    this.isLoading = true;
    this.profileService.updateVideos(this.userId, videos)
      .subscribe({
        next: (updatedProfile) => {
          this.profile = updatedProfile;
          this.isLoading = false;
          this.error = '';
        },
        error: (err) => {
          this.isLoading = false;
          this.error = 'Failed to update videos';
          console.error(err);
        }
      });
  }

  handleServiceChange(service: string, event: Event) {
    if (!this.profile) return;
    
    const isChecked = (event.target as HTMLInputElement).checked;
    
    // If service is being checked, remove any extra price for it
    if (isChecked) {
      const updatedExtra = { ...this.profile.services.extra };
      delete updatedExtra[service];
      
      const updatedIncluded = [...this.profile.services.included, service];
      this.updateServices(updatedIncluded, updatedExtra);
    } else {
      // Just remove from included services when unchecked
      const updatedIncluded = this.profile.services.included.filter(s => s !== service);
      this.updateServices(updatedIncluded, this.profile.services.extra);
    }
  }

  handleExtraPriceChange(service: string, event: Event) {
    if (!this.profile) return;
    
    const value = +(event.target as HTMLInputElement).value;
    
    // If setting an extra price, remove from included services
    const updatedIncluded = this.profile.services.included.filter(s => s !== service);
    
    const updatedExtra = {
      ...this.profile.services.extra,
      [service]: value
    };

    // If extra price is 0 or invalid, remove it from extra services
    if (!value || value <= 0) {
      delete updatedExtra[service];
    }

    this.updateServices(updatedIncluded, updatedExtra);
  }

  updateServices(included: string[], extra: { [key: string]: number }) {
    const servicesUpdate = { included, extra };
    
    this.profileService.updateField('services', servicesUpdate).subscribe({
      next: (updatedProfile) => {
        this.profile = updatedProfile;
      },
      error: (error: Error) => {
        this.error = `Failed to update services: ${error.message}`;
      }
    });
  }

  updatePhysicalAttribute(attribute: string, value: any) {
    if (!this.profile?.physicalAttributes) return;

    // Add validation for bust size
    if (attribute === 'bustSize') {
      const bustSizePattern = /^[0-9]{2}[A-K]$/;
      if (!bustSizePattern.test(value)) {
        this.error = 'Invalid bust size format. Example: 34C';
        return;
      }
      
      // Validate numeric range
      const size = parseInt(value.slice(0, 2));
      if (size < 32 || size > 42) {
        this.error = 'Bust size should be between 32 and 42';
        return;
      }
    }

    // Handle ethnicity case
    if (attribute === 'ethnicity') {
      // Capitalize first letter and lowercase the rest
      value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }

    const fieldName = `physicalAttributes.${attribute}`;
    this.profileService.updateField(fieldName, value).subscribe({
      next: (response) => {
        if (this.profile && this.profile.physicalAttributes) {
          this.profile.physicalAttributes = {
            ...this.profile.physicalAttributes,
            [attribute]: value
          };
        }
        this.error = ''; // Clear any previous errors
      },
      error: (error) => {
        this.error = `Failed to update ${attribute}: ${error.message}`;
        console.error('Failed to update physical attribute:', error);
      }
    });
  }

  updateBasicInfo(field: 'fullName' | 'bio', value: string) {
    this.profileService.updateField(field, value).subscribe({
      next: (response) => {
        if (this.profile) {
          this.profile[field] = value;
        }
      },
      error: (error) => {
        this.error = `Failed to update ${field}: ${error.message}`;
        console.error(`Failed to update ${field}:`, error);
      }
    });
  }

  updateMeetingWith(option: string, event: Event) {
    if (!this.profile) return;
    
    // Initialize availableToMeet if it doesn't exist
    if (!this.profile.availableToMeet) {
      this.profile.availableToMeet = {
        meetingWith: [],
        available24_7: false,
        advanceBooking: false
      };
    }

    const checked = (event.target as HTMLInputElement).checked;
    // Create a new array from existing meetingWith or empty array if undefined
    let meetingWith = [...(this.profile.availableToMeet.meetingWith || [])];

    if (checked && !meetingWith.includes(option)) {
      meetingWith.push(option);
    } else if (!checked) {
      meetingWith = meetingWith.filter(item => item !== option);
    }

    this.profileService.updateField('availableToMeet.meetingWith', meetingWith).subscribe({
      next: (response) => {
        if (this.profile?.availableToMeet) {
          this.profile.availableToMeet.meetingWith = meetingWith;
        }
      },
      error: (error) => {
        this.error = `Failed to update meeting preferences: ${error.message}`;
        console.error('Failed to update meeting preferences:', error);
      }
    });
  }

  updateAvailability(field: 'available24_7' | 'advanceBooking', value: boolean) {
    const fieldPath = `availableToMeet.${field}`;
    
    this.profileService.updateField(fieldPath, value).subscribe({
      next: (response) => {
        if (this.profile?.availableToMeet) {
          this.profile.availableToMeet[field] = value;
        }
      },
      error: (error) => {
        this.error = `Failed to update availability: ${error.message}`;
        console.error('Failed to update availability:', error);
      }
    });
  }

  updateRole(role: Role, event: Event) {
    if (!this.profile) return;
    
    const checked = (event.target as HTMLInputElement).checked;
    let updatedRoles = [...this.profile.role];

    if (checked && !updatedRoles.includes(role)) {
      updatedRoles.push(role);
    } else if (!checked) {
      updatedRoles = updatedRoles.filter(r => r !== role);
    }

    // Ensure at least one role is selected
    if (updatedRoles.length === 0) {
      updatedRoles = ['onenight'];
    }

    this.profileService.updateField('role', updatedRoles).subscribe({
      next: (response) => {
        if (this.profile) {
          this.profile.role = updatedRoles;
        }
      },
      error: (error) => {
        this.error = `Failed to update roles: ${error.message}`;
        console.error('Failed to update roles:', error);
      }
    });
  }
}