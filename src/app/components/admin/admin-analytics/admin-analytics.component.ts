import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container">
      <h2>Analytics Dashboard</h2>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>User Growth</h3>
          <div class="chart-placeholder">
            <p>Chart coming soon...</p>
          </div>
        </div>

        <div class="metric-card">
          <h3>Profile Views</h3>
          <div class="chart-placeholder">
            <p>Chart coming soon...</p>
          </div>
        </div>

        <div class="metric-card">
          <h3>Subscription Revenue</h3>
          <div class="chart-placeholder">
            <p>Chart coming soon...</p>
          </div>
        </div>

        <div class="metric-card">
          <h3>Active Users</h3>
          <div class="chart-placeholder">
            <p>Chart coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 2rem;
    }

    h2 {
      color: var(--text);
      margin-bottom: 2rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .metric-card {
      background: var(--surface);
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: var(--card-shadow);
    }

    .metric-card h3 {
      color: var(--text);
      margin-bottom: 1rem;
    }

    .chart-placeholder {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--background);
      border-radius: 4px;
      color: var(--text-secondary);
    }
  `]
})
export class AdminAnalyticsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    // TODO: Implement analytics data loading
  }
}
