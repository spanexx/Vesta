import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { UserProfile } from '../../../models/userProfile.model';

@Component({
  selector: 'app-admin-pending-verifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-pending-verifications.component.html',
  styleUrls: ['./admin-pending-verifications.component.css']
})
export class AdminPendingVerificationsComponent implements OnInit {
  pendingUsers: UserProfile[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingUsers();
  }

  loadPendingUsers(): void {
    this.isLoading = true;
    this.errorMessage = null;
    // This method will be created in AdminService later
    this.adminService.getPendingVerificationUsers().subscribe({
      next: (users) => {
        this.pendingUsers = users;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load users pending verification.';
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  navigateToEditUser(userId: string): void {
    // No additional code needed here, just update the route below
    this.router.navigate([`/admin/users/${userId}/edit`]);
  }
}
