import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, DashboardStats } from '../../../services/admin.service'; // Corrected path

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container">
      <h2>Analytics Dashboard</h2>

      <div *ngIf="isLoading" class="loading-message">
        <p>Loading analytics...</p>
      </div>

      <div *ngIf="errorLoading" class="error-message">
        <p>{{ errorLoading }}</p>
      </div>

      <div *ngIf="!isLoading && !errorLoading && !dashboardStats" class="no-data-message">
        <p>No analytics data available.</p>
      </div>

      <div *ngIf="!isLoading && !errorLoading && dashboardStats" class="metrics-grid">
        <div class="metric-card">
          <h3>User Growth</h3>
          <div class="metric-value">
            <p>{{ dashboardStats.recentSignups }} new users in the last 7 days</p>
            <p>Total Users: {{ dashboardStats.totalUsers }}</p>
          </div>
        </div>

        <div class="metric-card">
          <h3>User Engagement</h3>
          <div class="metric-value">
            <p>{{ dashboardStats.premiumUsers }} premium users</p>
            <small>(Displaying premium users as a proxy for profile views)</small>
          </div>
        </div>

        <div class="metric-card">
          <h3>Subscription Revenue</h3>
          <div class="metric-value">
            <p>$ {{ dashboardStats.totalRevenue | number:'1.2-2' }}</p>
          </div>
        </div>

        <div class="metric-card">
          <h3>Active Users</h3>
          <div class="metric-value">
            <p>{{ dashboardStats.activeUsers }} currently active</p>
             <p>Pending Verifications: {{ dashboardStats.pendingVerifications }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 2rem;
      background-color: var(--background-alt);
      min-height: 100vh;
    }

    h2 {
      color: var(--text);
      margin-bottom: 2rem;
      text-align: center;
      font-size: 2rem;
    }
    
    .loading-message, .error-message, .no-data-message {
      text-align: center;
      padding: 2rem;
      font-size: 1.2rem;
      color: var(--text-secondary);
    }

    .error-message p {
      background-color: var(--error-background);
      color: var(--error-text);
      padding: 1rem;
      border-radius: 8px;
      display: inline-block;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .metric-card {
      background: var(--surface);
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: var(--card-shadow);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .metric-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .metric-card h3 {
      color: var(--primary);
      margin-bottom: 1rem;
      font-size: 1.4rem;
      border-bottom: 2px solid var(--primary-light);
      padding-bottom: 0.5rem;
    }

    .metric-value p {
      font-size: 1.5rem;
      color: var(--text);
      margin: 0.5rem 0;
      font-weight: 500;
    }
    
    .metric-value small {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
  `]
})
export class AdminAnalyticsComponent implements OnInit {
  dashboardStats: DashboardStats | null = null;
  isLoading: boolean = true;
  errorLoading: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.errorLoading = null;
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.dashboardStats = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard stats:', err);
        this.errorLoading = 'Failed to load analytics data. Please try again later.';
        this.isLoading = false;
      }
    });
  }
}
