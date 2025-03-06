import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../models/userProfile.model';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css']
})
export class ProfileSettingsComponent implements OnInit {
  profileForm: FormGroup;
  userId: string = '';
  imagePreview: string | null = null;
  profilePicturePreview: string | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthenticationService
  ) {
    this.profileForm = this.createForm();
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = user._id;
        this.profileForm.patchValue(user);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      fullName: ['', Validators.required],
      bio: ['', [Validators.required, Validators.minLength(50)]],
      // Add other form controls as needed
    });
  }

  onProfilePictureSelected(event: Event) {
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
        next: () => {
          this.isLoading = false;
          this.error = null;
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
        next: () => {
          this.isLoading = false;
          this.error = null;
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
        next: () => {
          this.isLoading = false;
          this.error = null;
        },
        error: (err) => {
          this.isLoading = false;
          this.error = 'Failed to update videos';
          console.error(err);
        }
      });
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.isLoading = true;
      this.profileService.updateProfile(this.profileForm.value)
        .subscribe({
          next: (profile) => {
            this.isLoading = false;
            this.error = null;
            this.profileForm.patchValue(profile);
          },
          error: (err) => {
            this.isLoading = false;
            this.error = 'Failed to update profile';
            console.error(err);
          }
        });
    }
  }
}