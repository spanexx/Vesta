import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../models/userProfile.model';
import { AuthenticationService } from '../../services/authentication.service';
import { FileUploadService } from '../../services/file-upload.service';
import { Role, RoleOption } from '../../models/role.model';
import { forkJoin, lastValueFrom, map } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    public fileUploadService: FileUploadService,
    private snackBar: MatSnackBar
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
      this.snackBar.open('Cannot upload while account is pending verification', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    this.isLoading = true;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('video/')) {
        this.isLoading = false;
        this.snackBar.open('Invalid file type. Please select video files only.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        this.isLoading = false;
        this.snackBar.open('Video file size must be less than 100MB', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        this.fileUploadService.uploadVideo(
          base64Data,
          file.name,
          file.type,
          this.userId
        ).subscribe({
          next: (response: any) => {
            if (response.fileId) {
              this.profileService.updateVideos(this.userId, [response.fileId]).subscribe({
                next: (updatedProfile) => {
                  this.profile = updatedProfile;
                  this.isLoading = false;
                  this.snackBar.open('Video uploaded successfully', 'Close', {
                    duration: 3000,
                    panelClass: ['success-snackbar']
                  });
                },
                error: (err) => {
                  this.isLoading = false;
                  this.snackBar.open(err.error?.message || 'Failed to update profile with new video', 'Close', {
                    duration: 5000,
                    panelClass: ['error-snackbar']
                  });
                }
              });
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.snackBar.open(error.error?.message || 'Failed to upload video', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      };

      reader.onerror = () => {
        this.isLoading = false;
        this.snackBar.open('Error reading video file', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      };

      reader.readAsDataURL(file);
    });
  }

  updateProfilePicture(profilePicture: string) {
    this.isLoading = true;

    // Extract content type and filename from base64 string
    const contentType = profilePicture.split(';')[0].split(':')[1];
    const extension = contentType.split('/')[1];
    const filename = `profile_picture.${extension}`;

    this.fileUploadService.uploadProfilePicture(profilePicture, filename, contentType, this.userId)
      .subscribe({
        next: (updatedProfile: UserProfile) => {
          this.profile = updatedProfile;

          console.log('Updated profile:', updatedProfile);
          this.isLoading = false;
          this.error = '';
          this.snackBar.open('Profile picture updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (err) => {
          this.isLoading = false;
          this.error = 'Failed to update profile picture';
          this.snackBar.open('Failed to update profile picture', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          console.error("Err: ", err);
        }
      });
  }

  updateImages(images: string[]) {
    this.isLoading = true;
    const uploadObservables = images.map(image => {
      // Extract the actual content type from the base64 string
      const contentType = image.split(';')[0].split(':')[1];
      const filename = `gallery_image.${contentType.split('/')[1]}`; // Use appropriate extension
      
      return this.fileUploadService.uploadImage(image, filename, contentType, this.userId);
    });
    
    forkJoin(uploadObservables).subscribe({
      next: (responses: any[]) => {
        const fileIds = responses.map(res => res.fileId);
        this.profileService.updateImages(this.userId, fileIds).subscribe({
          next: (updatedProfile) => {
            console.log('Updated profile:', this.userId, fileIds);
            this.profile = updatedProfile;
            this.isLoading = false;
            this.snackBar.open('Images uploaded successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open(err.error?.message || 'Failed to update profile images', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open(error.error?.message || 'Image upload failed', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  updateVideos(videos: string[]) {
    console.log('Videos:', videos);
    this.isLoading = true;
    const uploadObservables = videos.map(video =>
      this.fileUploadService.uploadVideo(video, 'profile_video.mp4', 'video/mp4', this.userId)
    );
    
    forkJoin(uploadObservables).subscribe({
      next: (responses: any[]) => {
        const fileIds = responses.map(res => res.fileId);
        this.profileService.updateVideos(this.userId, fileIds).subscribe({
          next: (updatedProfile) => {
            this.profile = updatedProfile;
            this.isLoading = false;
          },
          error: (err) => {
            this.error = 'Failed to update profile videos';
            this.isLoading = false;
            console.error(err);
          }
        });
      },
      error: (error) => {
        this.error = 'Video upload failed: ' + error.message;
        this.isLoading = false;
        console.error(error);
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

  getProfilePictureUrl(): string {
    if (this.profile?.profilePicture) {
      return this.fileUploadService.getMediaUrl(this.profile.profilePicture);
    }
    return 'assets/avatar.jpg';
  }
}