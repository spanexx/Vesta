import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <nav class="sidebar" [class.open]="isNavOpen">
        <div class="sidebar-header">
          <h1>Vesta Admin</h1>
        </div>
        <div class="nav-links">
          <a routerLink="/admin/home" routerLinkActive="active">
            <i class="fas fa-home"></i> Dashboard
          </a>
          <a routerLink="/admin/users" routerLinkActive="active">
            <i class="fas fa-users"></i> Users
          </a>
          <a routerLink="/admin/moderation" routerLinkActive="active">
            <i class="fas fa-shield-alt"></i> Moderation
          </a>          <a routerLink="/admin/analytics" routerLinkActive="active">
            <i class="fas fa-chart-bar"></i> Analytics
          </a>
          <a routerLink="/admin/performance" routerLinkActive="active">
            <i class="fas fa-tachometer-alt"></i> Performance
          </a>
        </div>
        <div class="sidebar-footer">
          <button (click)="logout()" class="logout-btn">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </nav>

      <button class="nav-toggle" 
              [class.sidebar-open]="isNavOpen"
              (click)="toggleNav()">
        <i class="fas" [class.fa-chevron-right]="!isNavOpen" [class.fa-chevron-left]="isNavOpen"></i>
      </button>
      
      <div class="nav-overlay" [class.active]="isNavOpen" (click)="toggleNav()"></div>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: 250px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border);
    }

    .sidebar-header h1 {
      color: var(--text);
      font-size: 1.25rem;
      margin: 0;
    }

    .nav-links {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .nav-links a {
      text-decoration: none;
      color: var(--text-secondary);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s ease;
    }

    .nav-links a:hover,
    .nav-links a.active {
      background: var(--primary-light);
      color: var(--primary);
    }

    .nav-links i {
      width: 20px;
      text-align: center;
    }

    .sidebar-footer {
      margin-top: auto;
      padding: 1.5rem;
      border-top: 1px solid var(--border);
    }

    .logout-btn {
      width: 100%;
      padding: 0.75rem;
      background: none;
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--error);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .logout-btn:hover {
      background: var(--error-light);
      border-color: var(--error);
    }

    .main-content {
      flex: 1;
      background: var(--background);
      min-height: 100vh;
      overflow-y: auto;
    }

    .nav-toggle {
      display: none;
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      left: 0;
      z-index: 1002;
      background: var(--surface);
      border: none;
      border-radius: 0 8px 8px 0;
      padding: 1rem 0.75rem;
      color: var(--text);
      cursor: pointer;
      box-shadow: var(--card-shadow);
      transition: all 0.3s ease;
    }

    .nav-toggle:hover {
      background: var(--primary-light);
      color: var(--primary);
      padding-right: 1rem;
    }

    .nav-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .nav-overlay.active {
      opacity: 1;
    }

    @media (max-width: 1024px) {
      .sidebar {
        width: 200px;
      }
    }

    @media (max-width: 768px) {
      .nav-toggle {
        display: block;
      }

      .nav-toggle.show-filters {
        left: 230px; /* Match sidebar width */
      }

      .sidebar {
        position: fixed;
        left: -230px;
        top: 0;
        bottom: 0;
        width: 230px;
        z-index: 1001;
        transition: transform 0.3s ease;
      }

      .sidebar.open {
        transform: translateX(230px);
      }

      .nav-toggle.sidebar-open {
        left: 230px;
      }

      .nav-overlay {
        display: block;
        pointer-events: none;
      }

      .nav-overlay.active {
        pointer-events: auto;
      }

      .main-content {
        padding-left: 0;
      }

      .nav-links a {
        padding: 1rem;
      }

      .nav-links i {
        font-size: 1.1rem;
      }
    }

    @media (max-width: 480px) {
      .main-content {
        padding: 1rem;
      }

      .sidebar {
        width: 230px;
        left: -230px;
      }

      .sidebar.open {
        transform: translateX(230px);
      }

      .nav-toggle.sidebar-open {
        left: 230px;
      }

      .nav-links {
        padding: 1rem;
      }

      .nav-links a {
        padding: 0.875rem;
        font-size: 0.9rem;
      }
    }

    @media (min-width: 769px) {
      .sidebar {
        position: sticky;
        top: 0;
        height: 100vh;
      }
    }
  `]
})
export class AdminLayoutComponent {
  isNavOpen = false;
  
  constructor(private adminService: AdminService) {}

  toggleNav() {
    this.isNavOpen = !this.isNavOpen;
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      this.adminService.logout();
    }
  }
}
