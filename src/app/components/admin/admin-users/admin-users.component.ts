import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { UserProfile } from '../../../models/userProfile.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="users-container">
      <h2>User Management</h2>
      
      <div class="users-grid">
        <div *ngFor="let user of users" class="user-card">
          <img [src]="user.profilePicture || 'assets/default-avatar.png'" alt="Profile picture">
          <div class="user-info">
            <h3>{{user.username}}</h3>
            <p>{{user.email}}</p>
            <p>Status: {{user.status}}</p>
          </div>
          <div class="actions">
            <button (click)="editUser(user)">Edit</button>
            <button (click)="deleteUser(user._id)" class="delete">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 2rem;
    }
    
    .users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .user-card {
      background: var(--surface);
      padding: 1rem;
      border-radius: 8px;
      box-shadow: var(--card-shadow);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-card img {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-info {
      flex: 1;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: var(--transition);
    }

    button.delete {
      background: var(--error);
      color: white;
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: UserProfile[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.adminService.getAllProfiles().subscribe({
      next: (users) => this.users = users,
      error: (error) => console.error('Failed to load users:', error)
    });
  }

  editUser(user: UserProfile): void {
    // TODO: Implement edit user functionality
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.adminService.deleteProfile(userId).subscribe({
        next: () => this.users = this.users.filter(u => u._id !== userId),
        error: (error) => console.error('Failed to delete user:', error)
      });
    }
  }
}
