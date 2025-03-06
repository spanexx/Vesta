import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../models/userProfile.model';
import { CustomSpinnerComponent } from '../../custom-spinner/custom-spinner.component';
import { AuthenticationService } from '../../services/authentication.service';
import { FileUploadService } from '../../services/file-upload.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule, CustomSpinnerComponent, RouterModule, FormsModule],
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.css'],
  providers: [ProfileService]
})
export class ProfileDetailComponent implements OnInit {
  profile?: UserProfile;
  isLoading = true;
  error = '';
  isCurrentUser = false;
  userId: string = '';
  images: string[] = [];
  imagePreview: string | null = null;
  selectedImageIndex: number | null = null;
  selectedImage: string | null = null;
  rates: any = {
    incall: {},
    outcall: {}
  };
  editingField: string | null = null;
  tempEditValue: string = '';

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private authService: AuthenticationService,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.loadProfile(id);
    });


    this.authService.currentUser$.subscribe(currentUser => {
      console.log('Current User:', currentUser);
      if (currentUser) {
        this.userId = currentUser._id;
      }
      if (currentUser && this.profile) {
        this.isCurrentUser = currentUser._id === this.profile._id;
      }
    });
  }

  private loadProfile(id: string) {
    this.isLoading = true;
    this.profileService.getProfileById(id).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.rates.incall = profile.rates.incall;
        this.rates.outcall = profile.rates.outcall;
        this.isLoading = false;
        this.authService.currentUser$.subscribe(currentUser => {
          if (currentUser) {
            this.isCurrentUser = currentUser._id === profile._id;
          }
        });
      },
      error: (error) => {
        this.error = 'Failed to load profile';
        this.isLoading = false;
        console.error('Error loading profile:', error);
      }
    });
  }

  // Helper methods for displaying data
  getAge(birthdate: Date): number {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  formatLocation(coordinates: [number, number]): string {
    return `${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}`;
  }

  formatBirthday(birthdate: string | Date): number {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  onFileSelected(event: any, index?: number) {
    const file: File = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
      this.selectedImageIndex = index ?? null;
      
      // Optional: Auto-upload after preview
      if (confirm('Do you want to upload this image?')) {
        this.uploadImages([e.target.result]);
      }
    };
    reader.readAsDataURL(file);
  }


  updateVideos(videos: string[]) {
    this.profileService.updateVideos(this.userId, videos).subscribe(
      (response: any) => {
        console.log('Videos uploaded successfully', response);
      },
      (error: HttpErrorResponse) => {
        console.error('Error uploading videos', error);
      }
    );
  }

  updateProfilePicture(profilePicture: string) {
    this.profileService.updateProfilePicture(this.userId, profilePicture).subscribe(
      (response: any) => {
        console.log('User Id:', this.userId);

        console.log('Profile picture updated successfully', response);
        if (this.profile) {
          this.profile.profilePicture = response.profilePicture; // Update local profile picture if needed
        }
      },
      (error: HttpErrorResponse) => {
        console.error('Error updating profile picture', error);
      }
    );
  }

  updateProfilePictureFromFile(event: any) {
    const file: File = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.updateProfilePicture(e.target.result); // Assuming you want to store base64 string
    };
    reader.readAsDataURL(file);
  }

  updateVideosFromFile(event: any) {
    const files: FileList = event.target.files;
    const videoArray: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        videoArray.push(e.target.result); // Assuming you want to store base64 strings
        if (i === files.length - 1) {
          this.updateVideos(videoArray);
        }
      };
      reader.readAsDataURL(files[i]);
    }
  }

  uploadImages(images: string[]) {
    this.profileService.updateImages(this.userId, images).subscribe(
      (response: any) => {
        console.log('Images uploaded successfully', response);
        this.images = response.images; // Update local images array if needed
      },
      (error: HttpErrorResponse) => {
        console.error('Error uploading images', error);
      }
    );
  }

  addUserLike() {
    if (this.profile?._id) {
      this.profileService.addUserLike(this.profile._id).subscribe({
        next: (response) => {
          if (this.profile) {
            this.profile.userlikes = response.userlikes;
          }
        },
        error: (error) => {
          console.error('Error adding user like:', error);
        }
      });
    }
  }

  addViewerLike() {
    if (this.profile?._id) {
      this.profileService.addViewerLike(this.profile._id).subscribe({
        next: (response) => {
          if (this.profile) {
            this.profile.viewerlikes = response.viewerlikes;
          }
        },
        error: (error) => {
          console.error('Error adding viewer like:', error);
        }
      });
    }
  }

  openImageModal(image: string) {
    this.selectedImage = image;
  }

  closeImageModal() {
    this.selectedImage = null;
  }

  startEditing(fieldName: string, currentValue: string) {
    if (!this.isCurrentUser) return;
    this.editingField = fieldName;
    this.tempEditValue = currentValue;
  }

  cancelEditing() {
    this.editingField = null;
    this.tempEditValue = '';
  }

  saveField(fieldName: string) {
    if (!this.profile) return;

    this.profileService.updateField(fieldName, this.tempEditValue).subscribe({
      next: (updatedProfile) => {
        if (this.profile) {
          try {
            // Handle nested properties
            if (fieldName.includes('.')) {
              const [parent, child] = fieldName.split('.');
              if (this.profile[parent]) {
                (this.profile[parent] as any)[child] = this.tempEditValue;
              }
            } else {
              // Handle direct properties
              (this.profile as any)[fieldName] = this.tempEditValue;
            }
            
            // Create a new reference to trigger change detection
            this.profile = { ...this.profile };
          } catch (error) {
            console.error('Error updating profile field:', error);
          }
        }
        this.editingField = null;
        this.tempEditValue = '';
      },
      error: (error) => {
        console.error('Error updating field:', error);
        this.cancelEditing();
        this.error = 'Failed to update field. Please try again.';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }
}
