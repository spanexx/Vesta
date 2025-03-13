import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../../../models/userProfile.model';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-header" *ngIf="profile">
      <h1>{{ profile.fullName }}</h1>
      <p class="username">{{"@" + profile.username }}</p>
      <p class="birthday" *ngIf="profile.birthdate">
        Age: {{ getAge(profile.birthdate) }}
      </p>
    </div>
  `
})
export class ProfileHeaderComponent {
  @Input() profile?: UserProfile;

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
}
