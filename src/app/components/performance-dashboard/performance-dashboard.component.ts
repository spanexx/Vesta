import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { PerformanceService, PerformanceMetrics, PerformanceAlert } from '../../services/performance.service';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './performance-dashboard.component.html',
  styleUrls: ['./performance-dashboard.component.scss']
})
export class PerformanceDashboardComponent implements OnInit, OnDestroy {
  currentMetrics: PerformanceMetrics | null = null;
  backendMetrics: any = null;
  alerts: PerformanceAlert[] = [];
  isAdmin = false;
  isLoading = true;
  error: string | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private performanceService: PerformanceService,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.checkAdminStatus();
    this.initializeMetricsMonitoring();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private checkAdminStatus(): void {
    // Check if user is admin
    this.isAdmin = this.authService.isAdmin();
  }

  private initializeMetricsMonitoring(): void {
    // Subscribe to frontend metrics
    const metricsSub = this.performanceService.metrics$.subscribe(metrics => {
      this.currentMetrics = metrics;
      this.isLoading = false;
    });
    this.subscriptions.push(metricsSub);

    // Subscribe to alerts
    const alertsSub = this.performanceService.alerts$.subscribe(alerts => {
      this.alerts = alerts;
    });
    this.subscriptions.push(alertsSub);

    // Refresh backend metrics every 30 seconds for admins
    if (this.isAdmin) {
      const backendMetricsSub = interval(30000).subscribe(() => {
        this.loadBackendMetrics();
      });
      this.subscriptions.push(backendMetricsSub);
    }
  }

  private loadInitialData(): void {
    if (this.isAdmin) {
      this.loadBackendMetrics();
    }
  }

  private loadBackendMetrics(): void {
    if (!this.isAdmin) return;

    this.performanceService.getBackendMetrics().subscribe({
      next: (metrics) => {
        this.backendMetrics = metrics;
        this.error = null;
      },
      error: (error) => {
        console.error('Failed to load backend metrics:', error);
        this.error = 'Failed to load backend metrics';
      }
    });
  }

  establishBaseline(): void {
    this.performanceService.establishBaseline();
  }

  getWebVitalStatus(metric: string, value?: number): string {
    if (!value) return 'unknown';

    const thresholds: any = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'good': return '#0cce6b';
      case 'needs-improvement': return '#ffa400';
      case 'poor': return '#ff4e42';
      default: return '#9aa0a6';
    }
  }

  formatMetric(value?: number, unit: string = 'ms'): string {
    if (value === undefined || value === null) return 'N/A';
    return `${Math.round(value)}${unit}`;
  }

  formatBytes(bytes?: number): string {
    if (!bytes) return 'N/A';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }

  getAlertIcon(type: string): string {
    return type === 'error' ? '⚠️' : '⚡';
  }

  refreshMetrics(): void {
    this.isLoading = true;
    this.loadBackendMetrics();
    
    // Force collection of new frontend metrics
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  forceGC(): void {
    this.performanceService.forceGarbageCollection();
  }
}
