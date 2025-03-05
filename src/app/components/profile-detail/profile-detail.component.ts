import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../interfaces/profile.interface';
import { CustomSpinnerComponent } from '../../custom-spinner/custom-spinner.component';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule, CustomSpinnerComponent],
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.css']
})
export class ProfileDetailComponent implements OnInit {
  profile?: UserProfile;
  isLoading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.loadProfile(id);
    });
  }

  private loadProfile(id: string) {
    this.isLoading = true;
    this.profileService.getProfileById(id).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.isLoading = false;
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
}
