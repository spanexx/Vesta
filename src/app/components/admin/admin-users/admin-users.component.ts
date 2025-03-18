import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { UserProfile } from '../../../models/userProfile.model';
import { Router } from '@angular/router';
import { FileUploadService } from '../../../services/file-upload.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { ProfileService } from '../../../services/profile.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: UserProfile[] = [];
  profile: UserProfile | null = null;
  error = '';

  constructor(
    private adminService: AdminService,
    private router: Router,
    private fileUploadService: FileUploadService,
    private authService: AuthenticationService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadProfile() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.profileService.getProfileById(user._id).subscribe({
          next: (profile) => {
            this.profile = profile;
          },
          error: (error) => {
            this.error = 'Failed to load profile';
          }
        });
      }
    });
  }

  private loadUsers(): void {
    this.adminService.getAllProfiles().subscribe({
      next: (users) => this.users = users,
      error: (error) => console.error('Failed to load users:', error)
    });
  }

  editUser(user: UserProfile): void {
    this.router.navigate(['/admin/users', user._id, 'edit']);
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.adminService.deleteProfile(userId).subscribe({
        next: () => this.users = this.users.filter(u => u._id !== userId),
        error: (error) => console.error('Failed to delete user:', error)
      });
    }
  }

  getUserProfilePictureUrl(user: UserProfile): string {
    if (user?.profilePicture) {
      return this.fileUploadService.getMediaUrl(user.profilePicture);
    }
    return 'assets/default-profile.png';
  }
}
