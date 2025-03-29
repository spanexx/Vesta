import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { UserProfile } from '../../../models/userProfile.model';
import { Router } from '@angular/router';
import { FileUploadService } from '../../../services/file-upload.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { ProfileService } from '../../../services/profile.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  users: UserProfile[] = [];
  profile: UserProfile | null = null;
  error = '';
  isLoading = false;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private fileUploadService: FileUploadService,
    private authService: AuthenticationService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadProfile() {
    if (this.isLoading) return;
    
    this.subscriptions.add(
      this.authService.currentUser$.pipe(take(1)).subscribe(user => {
        if (user) {
          this.isLoading = true;
          this.subscriptions.add(
            this.profileService.getProfileById(user._id).pipe(take(1)).subscribe({
              next: (profile) => {
                this.profile = profile;
                this.isLoading = false;
              },
              error: (error) => {
                this.error = 'Failed to load profile';
                this.isLoading = false;
              }
            })
          );
        } else {
          this.isLoading = false;
          this.profile = null;
        }
      })
    );
  }

  private loadUsers(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.subscriptions.add(
      this.adminService.getAllProfiles().pipe(take(1)).subscribe({
        next: (users) => {
          this.users = users;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load users:', error);
          this.error = 'Failed to load users';
          this.isLoading = false;
        }
      })
    );
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
    return 'assets/avatar.jpg';
  }
}
