import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment.prod';

export interface WebVitalsMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

export interface PerformanceMetrics {
  timestamp: number;
  webVitals: WebVitalsMetrics;
  navigation: {
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
  };
  resources: {
    totalResources: number;
    totalSize: number;
    slowResources: any[];
  };
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

export interface PerformanceAlert {
  type: 'warning' | 'error';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metricsSubject = new BehaviorSubject<PerformanceMetrics | null>(null);
  private alertsSubject = new BehaviorSubject<PerformanceAlert[]>([]);
  private isCollecting = false;
  private baselineMetrics: PerformanceMetrics | null = null;

  // Performance thresholds based on Core Web Vitals
  private thresholds = {
    fcp: { good: 1800, poor: 3000 }, // ms
    lcp: { good: 2500, poor: 4000 }, // ms
    fid: { good: 100, poor: 300 }, // ms
    cls: { good: 0.1, poor: 0.25 }, // score
    ttfb: { good: 800, poor: 1800 }, // ms
    loadTime: { good: 3000, poor: 5000 }, // ms
    memoryUsage: { warning: 80, critical: 95 } // percentage
  };

  public metrics$ = this.metricsSubject.asObservable();
  public alerts$ = this.alertsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window !== 'undefined') {
      // Start collecting metrics after page load
      if (document.readyState === 'complete') {
        this.startMetricsCollection();
      } else {
        window.addEventListener('load', () => {
          setTimeout(() => this.startMetricsCollection(), 1000);
        });
      }

      // Initialize Web Vitals monitoring
      this.initWebVitals();
      
      // Monitor route changes for SPA performance
      this.monitorRouteChanges();
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    
    // Collect initial metrics
    this.collectMetrics();
    
    // Collect metrics every 30 seconds
    interval(30000).subscribe(() => {
      this.collectMetrics();
    });
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics(): void {
    try {
      const metrics: PerformanceMetrics = {
        timestamp: Date.now(),
        webVitals: this.getWebVitals(),
        navigation: this.getNavigationMetrics(),
        resources: this.getResourceMetrics(),
        memory: this.getMemoryMetrics(),
        connection: this.getConnectionMetrics()
      };

      this.metricsSubject.next(metrics);
      this.checkThresholds(metrics);
      
      // Send metrics to backend for centralized monitoring
      this.sendMetricsToBackend(metrics);
      
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initWebVitals(): void {
    // First Contentful Paint
    this.observePerformance('paint', (entry: any) => {
      if (entry.name === 'first-contentful-paint') {
        this.updateWebVital('fcp', entry.startTime);
      }
    });

    // Largest Contentful Paint
    this.observePerformance('largest-contentful-paint', (entry: any) => {
      this.updateWebVital('lcp', entry.startTime);
    });

    // First Input Delay
    this.observePerformance('first-input', (entry: any) => {
      this.updateWebVital('fid', entry.processingStart - entry.startTime);
    });

    // Cumulative Layout Shift
    this.observePerformance('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        this.updateWebVital('cls', entry.value);
      }
    });
  }

  /**
   * Observe performance entries
   */
  private observePerformance(type: string, callback: (entry: any) => void): void {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(callback);
        });
        observer.observe({ entryTypes: [type] });
      } catch (error) {
        console.warn(`Failed to observe ${type} performance:`, error);
      }
    }
  }

  /**
   * Update web vital metric
   */
  private updateWebVital(metric: keyof WebVitalsMetrics, value: number): void {
    const currentMetrics = this.metricsSubject.value;
    if (currentMetrics) {
      currentMetrics.webVitals[metric] = value;
      this.metricsSubject.next(currentMetrics);
    }
  }

  /**
   * Get Web Vitals metrics
   */
  private getWebVitals(): WebVitalsMetrics {
    const vitals: WebVitalsMetrics = {};
    
    if (typeof performance !== 'undefined') {
      // Get paint metrics
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        vitals.fcp = fcpEntry.startTime;
      }

      // Get navigation timing for TTFB
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        vitals.ttfb = navEntries[0].responseStart - navEntries[0].fetchStart;
      }
    }
    
    return vitals;
  }

  /**
   * Get navigation performance metrics
   */
  private getNavigationMetrics(): any {
    if (typeof performance === 'undefined') {
      return { loadTime: 0, domContentLoaded: 0, firstPaint: 0 };
    }

    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length === 0) {
      return { loadTime: 0, domContentLoaded: 0, firstPaint: 0 };
    }

    const nav = navEntries[0];
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');    return {
      loadTime: nav.loadEventEnd - nav.fetchStart,
      domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
      firstPaint: firstPaint ? firstPaint.startTime : 0
    };
  }

  /**
   * Get resource performance metrics
   */
  private getResourceMetrics(): any {
    if (typeof performance === 'undefined') {
      return { totalResources: 0, totalSize: 0, slowResources: [] };
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const slowResources = resources.filter(resource => 
      resource.duration > 1000 // Resources taking more than 1 second
    );

    const totalSize = resources.reduce((sum, resource) => {
      return sum + (resource.transferSize || 0);
    }, 0);

    return {
      totalResources: resources.length,
      totalSize,
      slowResources: slowResources.map(resource => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize
      }))
    };
  }

  /**
   * Get memory usage metrics
   */
  private getMemoryMetrics(): any {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return undefined;
  }

  /**
   * Get connection information
   */
  private getConnectionMetrics(): any {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }
    return undefined;
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // Check Core Web Vitals
    if (metrics.webVitals.fcp && metrics.webVitals.fcp > this.thresholds.fcp.poor) {
      alerts.push({
        type: 'error',
        metric: 'FCP',
        value: metrics.webVitals.fcp,
        threshold: this.thresholds.fcp.poor,
        message: `First Contentful Paint is poor: ${Math.round(metrics.webVitals.fcp)}ms`,
        timestamp: metrics.timestamp
      });
    }

    if (metrics.webVitals.lcp && metrics.webVitals.lcp > this.thresholds.lcp.poor) {
      alerts.push({
        type: 'error',
        metric: 'LCP',
        value: metrics.webVitals.lcp,
        threshold: this.thresholds.lcp.poor,
        message: `Largest Contentful Paint is poor: ${Math.round(metrics.webVitals.lcp)}ms`,
        timestamp: metrics.timestamp
      });
    }

    if (metrics.navigation.loadTime > this.thresholds.loadTime.poor) {
      alerts.push({
        type: 'warning',
        metric: 'Load Time',
        value: metrics.navigation.loadTime,
        threshold: this.thresholds.loadTime.poor,
        message: `Page load time is slow: ${Math.round(metrics.navigation.loadTime)}ms`,
        timestamp: metrics.timestamp
      });
    }

    // Check memory usage
    if (metrics.memory) {
      const memoryUsagePercent = (metrics.memory.usedJSHeapSize / metrics.memory.jsHeapSizeLimit) * 100;
      if (memoryUsagePercent > this.thresholds.memoryUsage.critical) {
        alerts.push({
          type: 'error',
          metric: 'Memory Usage',
          value: memoryUsagePercent,
          threshold: this.thresholds.memoryUsage.critical,
          message: `Critical memory usage: ${Math.round(memoryUsagePercent)}%`,
          timestamp: metrics.timestamp
        });
      }
    }

    this.alertsSubject.next(alerts);
  }

  /**
   * Monitor route changes for SPA performance
   */
  private monitorRouteChanges(): void {
    // This would integrate with Angular Router to monitor navigation performance
    // Implementation depends on specific routing setup
  }

  /**
   * Send metrics to backend
   */  private sendMetricsToBackend(metrics: PerformanceMetrics): void {
    const endpoint = `${environment.apiUrl}/performance/frontend-metrics`;
    
    this.http.post(endpoint, {
      metrics,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now()
    }).pipe(
      catchError(error => {
        console.warn('Failed to send performance metrics to backend:', error);
        return [];
      })
    ).subscribe();
  }

  /**
   * Establish baseline performance metrics
   */
  public establishBaseline(): void {
    const currentMetrics = this.metricsSubject.value;
    if (currentMetrics) {
      this.baselineMetrics = { ...currentMetrics };
      localStorage.setItem('performanceBaseline', JSON.stringify(this.baselineMetrics));
      console.log('Performance baseline established:', this.baselineMetrics);
    }
  }

  /**
   * Compare current metrics to baseline
   */
  public compareToBaseline(): any {
    const currentMetrics = this.metricsSubject.value;
    if (!currentMetrics || !this.baselineMetrics) {
      return null;
    }

    return {
      fcp: this.calculateChange(currentMetrics.webVitals.fcp, this.baselineMetrics.webVitals.fcp),
      lcp: this.calculateChange(currentMetrics.webVitals.lcp, this.baselineMetrics.webVitals.lcp),
      loadTime: this.calculateChange(currentMetrics.navigation.loadTime, this.baselineMetrics.navigation.loadTime),
      resourceCount: this.calculateChange(currentMetrics.resources.totalResources, this.baselineMetrics.resources.totalResources)
    };
  }

  /**
   * Calculate percentage change between current and baseline
   */
  private calculateChange(current?: number, baseline?: number): any {
    if (!current || !baseline) {
      return { change: 0, status: 'unknown' };
    }

    const change = ((current - baseline) / baseline) * 100;
    const status = change > 10 ? 'worse' : change < -10 ? 'better' : 'stable';

    return { change: Math.round(change), status };
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics | null {
    return this.metricsSubject.value;
  }

  /**
   * Get current alerts
   */
  public getCurrentAlerts(): PerformanceAlert[] {
    return this.alertsSubject.value;
  }

  /**
   * Get backend performance metrics (admin only)
   */  public getBackendMetrics(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/performance/metrics`).pipe(
      catchError(error => {
        console.error('Failed to fetch backend metrics:', error);
        throw error;
      })
    );
  }

  /**
   * Get performance comparison with baseline
   */  public getPerformanceComparison(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/performance/comparison`).pipe(
      catchError(error => {
        console.error('Failed to fetch performance comparison:', error);
        throw error;
      })
    );
  }

  /**
   * Force garbage collection (if available)
   */
  public forceGarbageCollection(): void {
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
      console.log('Garbage collection triggered');
    }
  }
}
