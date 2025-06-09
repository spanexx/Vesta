import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';
import { config } from '../config/config.js';

/**
 * Enhanced Performance Metrics Service
 * Provides comprehensive baseline measurement and monitoring capabilities
 */
export class PerformanceMetricsService {
  constructor() {
    this.metricsHistory = [];
    this.frontendMetrics = [];
    this.baselineMetrics = {};
    this.performanceThresholds = {
      responseTime: {
        warning: 500,
        critical: 1000
      },
      memoryUsage: {
        warning: 80, // percentage
        critical: 90
      },
      cpuUsage: {
        warning: 70, // percentage
        critical: 85
      },
      errorRate: {
        warning: 2, // percentage
        critical: 5
      },
      throughput: {
        warning: 50, // requests per second
        critical: 25
      }
    };
    
    this.metricsFile = path.join(process.cwd(), 'logs', 'performance-metrics.json');
    this.baselineFile = path.join(process.cwd(), 'logs', 'performance-baseline.json');
    
    this.initializeMetricsCollection();
    this.loadBaselineMetrics();
  }

  /**
   * Initialize automated metrics collection
   */
  async initializeMetricsCollection() {
    try {
      // Ensure logs directory exists
      await fs.mkdir(path.dirname(this.metricsFile), { recursive: true });
      
      // Start periodic metrics collection
      this.startPeriodicCollection();
      
      logger.info('Performance metrics collection initialized');
    } catch (error) {
      logger.error('Failed to initialize performance metrics collection:', error);
    }
  }

  /**
   * Start periodic performance metrics collection
   */
  startPeriodicCollection() {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectCurrentMetrics();
    }, 30000);

    // Save metrics to file every 5 minutes
    setInterval(() => {
      this.saveMetricsToFile();
    }, 300000);

    // Generate daily performance reports
    setInterval(() => {
      this.generateDailyReport();
    }, 24 * 60 * 60 * 1000); // Once per day
  }

  /**
   * Collect current system performance metrics
   */  async collectCurrentMetrics() {
    try {
      logger.debug('Starting metrics collection...');
      
      const metrics = {
        timestamp: new Date().toISOString(),
        memory: this.getMemoryMetrics(),
        cpu: await this.getCPUMetrics(),
        requests: this.getRequestMetrics(),
        errors: this.getErrorMetrics(),
        responseTime: this.getResponseTimeMetrics(),
        uptime: process.uptime()
      };

      logger.debug('Metrics collected successfully:', { 
        memoryUsage: metrics.memory.heapUsed,
        cpuUsage: metrics.cpu.percentage,
        totalRequests: metrics.requests.total
      });

      this.metricsHistory.push(metrics);
      
      // Keep only last 1000 entries in memory
      if (this.metricsHistory.length > 1000) {
        this.metricsHistory = this.metricsHistory.slice(-1000);
      }

      // Check for threshold violations
      this.checkThresholds(metrics);
      
      return metrics;
    } catch (error) {
      logger.error('Failed to collect performance metrics:', error);
      logger.error('Error stack:', error.stack);
      
      // Return basic metrics to prevent complete failure
      return {
        timestamp: new Date().toISOString(),
        memory: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0, percentageUsed: 0 },
        cpu: { percentage: 0, loadAverage: [0, 0, 0] },
        requests: { total: 0, perSecond: 0, active: 0 },
        errors: { total: 0, rate: 0, last24h: 0 },
        responseTime: { average: 0, p95: 0, p99: 0, max: 0 },
        uptime: process.uptime(),
        error: 'Failed to collect complete metrics'
      };
    }
  }

  /**
   * Get memory usage metrics
   */
  getMemoryMetrics() {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100, // MB
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
      percentageUsed: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100 * 100) / 100
    };
  }

  /**
   * Get CPU usage metrics
   */
  async getCPUMetrics() {
    const startUsage = process.cpuUsage();
    
    // Wait 100ms to get a proper CPU reading
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endUsage = process.cpuUsage(startUsage);
    const cpuPercent = (endUsage.user + endUsage.system) / 100000; // Convert to percentage
    
    return {
      user: endUsage.user,
      system: endUsage.system,
      percentage: Math.round(cpuPercent * 100) / 100
    };
  }

  /**
   * Get request metrics (would be populated by monitoring middleware)
   */
  getRequestMetrics() {
    // This would be populated by the monitoring middleware
    return {
      total: global.requestMetrics?.total || 0,
      perSecond: global.requestMetrics?.perSecond || 0,
      active: global.requestMetrics?.active || 0
    };
  }

  /**
   * Get error metrics
   */
  getErrorMetrics() {
    return {
      total: global.errorMetrics?.total || 0,
      rate: global.errorMetrics?.rate || 0,
      last24h: global.errorMetrics?.last24h || 0
    };
  }

  /**
   * Get response time metrics
   */
  getResponseTimeMetrics() {
    return {
      average: global.responseTimeMetrics?.average || 0,
      p95: global.responseTimeMetrics?.p95 || 0,
      p99: global.responseTimeMetrics?.p99 || 0,
      max: global.responseTimeMetrics?.max || 0
    };
  }

  /**
   * Get baseline metrics
   */
  getBaseline() {
    return this.baselineMetrics;
  }

  /**
   * Check performance thresholds and generate alerts
   */
  checkThresholds(metrics) {
    const alerts = [];
    
    if (!metrics) {
      return alerts;
    }
    
    // Memory usage checks
    if (metrics.memory?.percentageUsed > this.performanceThresholds.memoryUsage.critical) {
      alerts.push({
        type: 'CRITICAL',
        category: 'memory',
        message: `Critical memory usage: ${metrics.memory.percentageUsed.toFixed(1)}%`,
        value: metrics.memory.percentageUsed,
        threshold: this.performanceThresholds.memoryUsage.critical
      });
    } else if (metrics.memory?.percentageUsed > this.performanceThresholds.memoryUsage.warning) {
      alerts.push({
        type: 'WARNING',
        category: 'memory',
        message: `High memory usage: ${metrics.memory.percentageUsed.toFixed(1)}%`,
        value: metrics.memory.percentageUsed,
        threshold: this.performanceThresholds.memoryUsage.warning
      });
    }
    
    // CPU usage checks
    if (metrics.cpu?.percentage > this.performanceThresholds.cpuUsage.critical) {
      alerts.push({
        type: 'CRITICAL',
        category: 'cpu',
        message: `Critical CPU usage: ${metrics.cpu.percentage.toFixed(1)}%`,
        value: metrics.cpu.percentage,
        threshold: this.performanceThresholds.cpuUsage.critical
      });
    } else if (metrics.cpu?.percentage > this.performanceThresholds.cpuUsage.warning) {
      alerts.push({
        type: 'WARNING',
        category: 'cpu',
        message: `High CPU usage: ${metrics.cpu.percentage.toFixed(1)}%`,
        value: metrics.cpu.percentage,
        threshold: this.performanceThresholds.cpuUsage.warning
      });
    }
    
    // Response time checks
    if (metrics.responseTime?.average > this.performanceThresholds.responseTime.critical) {
      alerts.push({
        type: 'CRITICAL',
        category: 'responseTime',
        message: `Critical response time: ${metrics.responseTime.average.toFixed(0)}ms`,
        value: metrics.responseTime.average,
        threshold: this.performanceThresholds.responseTime.critical
      });
    } else if (metrics.responseTime?.average > this.performanceThresholds.responseTime.warning) {
      alerts.push({
        type: 'WARNING',
        category: 'responseTime',
        message: `Slow response time: ${metrics.responseTime.average.toFixed(0)}ms`,
        value: metrics.responseTime.average,
        threshold: this.performanceThresholds.responseTime.warning
      });
    }
    
    // Error rate checks
    if (metrics.errors?.rate > this.performanceThresholds.errorRate.critical) {
      alerts.push({
        type: 'CRITICAL',
        category: 'errorRate',
        message: `Critical error rate: ${metrics.errors.rate.toFixed(1)}%`,
        value: metrics.errors.rate,
        threshold: this.performanceThresholds.errorRate.critical
      });
    } else if (metrics.errors?.rate > this.performanceThresholds.errorRate.warning) {
      alerts.push({
        type: 'WARNING',
        category: 'errorRate',
        message: `High error rate: ${metrics.errors.rate.toFixed(1)}%`,
        value: metrics.errors.rate,
        threshold: this.performanceThresholds.errorRate.warning
      });
    }
    
    // Log alerts
    alerts.forEach(alert => {
      if (alert.type === 'CRITICAL') {
        logger.error(`Performance Alert: ${alert.message}`);
      } else {
        logger.warn(`Performance Alert: ${alert.message}`);
      }
    });

    return alerts;
  }

  /**
   * Establish baseline performance metrics
   */
  async establishBaseline() {
    try {
      logger.info('Establishing performance baseline...');
      
      const baselineMetrics = [];
      const measurementDuration = 5 * 60 * 1000; // 5 minutes
      const measurementInterval = 10 * 1000; // 10 seconds
      const numberOfMeasurements = measurementDuration / measurementInterval;

      for (let i = 0; i < numberOfMeasurements; i++) {
        const metrics = await this.collectCurrentMetrics();
        if (metrics) {
          baselineMetrics.push(metrics);
        }
        
        if (i < numberOfMeasurements - 1) {
          await new Promise(resolve => setTimeout(resolve, measurementInterval));
        }
      }

      // Calculate baseline averages
      this.baselineMetrics = this.calculateBaselineAverages(baselineMetrics);
      
      // Save baseline to file
      await this.saveBaselineMetrics();
      
      logger.info('Performance baseline established:', this.baselineMetrics);
      return this.baselineMetrics;
    } catch (error) {
      logger.error('Failed to establish performance baseline:', error);
      throw error;
    }
  }

  /**
   * Calculate baseline averages from collected metrics
   */
  calculateBaselineAverages(metrics) {
    const totals = metrics.reduce((acc, metric) => {
      acc.memory.heapUsed += metric.memory.heapUsed;
      acc.memory.percentageUsed += metric.memory.percentageUsed;
      acc.cpu.percentage += metric.cpu.percentage;
      acc.responseTime.average += metric.responseTime.average;
      acc.requests.perSecond += metric.requests.perSecond;
      acc.errors.rate += metric.errors.rate;
      return acc;
    }, {
      memory: { heapUsed: 0, percentageUsed: 0 },
      cpu: { percentage: 0 },
      responseTime: { average: 0 },
      requests: { perSecond: 0 },
      errors: { rate: 0 }
    });

    const count = metrics.length;
    
    return {
      timestamp: new Date().toISOString(),
      memory: {
        heapUsedAvg: Math.round(totals.memory.heapUsed / count * 100) / 100,
        percentageUsedAvg: Math.round(totals.memory.percentageUsed / count * 100) / 100
      },
      cpu: {
        percentageAvg: Math.round(totals.cpu.percentage / count * 100) / 100
      },
      responseTime: {
        averageAvg: Math.round(totals.responseTime.average / count * 100) / 100
      },
      requests: {
        perSecondAvg: Math.round(totals.requests.perSecond / count * 100) / 100
      },
      errors: {
        rateAvg: Math.round(totals.errors.rate / count * 100) / 100
      },
      measurementCount: count,
      measurementDuration: '5 minutes'
    };
  }

  /**
   * Save baseline metrics to file
   */
  async saveBaselineMetrics() {
    try {
      await fs.writeFile(this.baselineFile, JSON.stringify(this.baselineMetrics, null, 2));
      logger.info('Baseline metrics saved to file');
    } catch (error) {
      logger.error('Failed to save baseline metrics:', error);
    }
  }

  /**
   * Load baseline metrics from file
   */
  async loadBaselineMetrics() {
    try {
      const data = await fs.readFile(this.baselineFile, 'utf8');
      this.baselineMetrics = JSON.parse(data);
      logger.info('Baseline metrics loaded from file');
    } catch (error) {
      logger.info('No existing baseline metrics found - will establish new baseline');
    }
  }

  /**
   * Save metrics history to file
   */
  async saveMetricsToFile() {
    try {
      const metricsData = {
        lastUpdated: new Date().toISOString(),
        baseline: this.baselineMetrics,
        recentMetrics: this.metricsHistory.slice(-100) // Last 100 entries
      };
      
      await fs.writeFile(this.metricsFile, JSON.stringify(metricsData, null, 2));
    } catch (error) {
      logger.error('Failed to save metrics to file:', error);
    }
  }

  /**
   * Generate daily performance report
   */
  async generateDailyReport() {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const dailyMetrics = this.metricsHistory.filter(m => 
        new Date(m.timestamp) >= yesterday
      );

      if (dailyMetrics.length === 0) {
        logger.info('No metrics available for daily report');
        return;
      }

      const report = this.calculateDailyAverages(dailyMetrics);
      const reportFile = path.join(
        process.cwd(), 
        'logs', 
        `daily-performance-report-${now.toISOString().split('T')[0]}.json`
      );
      
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      logger.info(`Daily performance report generated: ${reportFile}`);
      
      return report;
    } catch (error) {
      logger.error('Failed to generate daily report:', error);
    }
  }

  /**
   * Calculate daily averages for reporting
   */
  calculateDailyAverages(metrics) {
    const totals = metrics.reduce((acc, metric) => {
      acc.memory += metric.memory.percentageUsed;
      acc.cpu += metric.cpu.percentage;
      acc.responseTime += metric.responseTime.average;
      acc.requests += metric.requests.perSecond;
      acc.errors += metric.errors.rate;
      return acc;
    }, { memory: 0, cpu: 0, responseTime: 0, requests: 0, errors: 0 });

    const count = metrics.length;
    
    return {
      date: new Date().toISOString().split('T')[0],
      period: '24 hours',
      averages: {
        memoryUsage: Math.round(totals.memory / count * 100) / 100,
        cpuUsage: Math.round(totals.cpu / count * 100) / 100,
        responseTime: Math.round(totals.responseTime / count * 100) / 100,
        requestsPerSecond: Math.round(totals.requests / count * 100) / 100,
        errorRate: Math.round(totals.errors / count * 100) / 100
      },
      baseline: this.baselineMetrics,
      comparisons: this.compareToBaseline(totals, count),
      metricsCount: count
    };
  }

  /**
   * Compare current metrics to baseline (simpler version for route usage)
   */
  compareToBaseline() {
    const current = this.getCurrentPerformanceSummary();
    
    if (!this.baselineMetrics || !current?.current) {
      return { message: 'No baseline or current metrics available for comparison' };
    }

    const baseline = {
      memoryUsage: this.baselineMetrics.memory?.percentageUsedAvg || 0,
      cpuUsage: this.baselineMetrics.cpu?.percentageAvg || 0,
      responseTime: this.baselineMetrics.responseTime?.averageAvg || 0
    };

    const currentMetrics = current.current;

    return {
      memory: {
        current: currentMetrics.memory?.percentageUsed || 0,
        baseline: baseline.memoryUsage,
        change: (currentMetrics.memory?.percentageUsed || 0) - baseline.memoryUsage,
        percentChange: baseline.memoryUsage > 0 ? 
          Math.round((((currentMetrics.memory?.percentageUsed || 0) - baseline.memoryUsage) / baseline.memoryUsage) * 100 * 100) / 100 : 0
      },
      cpu: {
        current: currentMetrics.cpu?.percentage || 0,
        baseline: baseline.cpuUsage,
        change: (currentMetrics.cpu?.percentage || 0) - baseline.cpuUsage,
        percentChange: baseline.cpuUsage > 0 ? 
          Math.round((((currentMetrics.cpu?.percentage || 0) - baseline.cpuUsage) / baseline.cpuUsage) * 100 * 100) / 100 : 0
      },
      responseTime: {
        current: currentMetrics.responseTime?.average || 0,
        baseline: baseline.responseTime,
        change: (currentMetrics.responseTime?.average || 0) - baseline.responseTime,
        percentChange: baseline.responseTime > 0 ? 
          Math.round((((currentMetrics.responseTime?.average || 0) - baseline.responseTime) / baseline.responseTime) * 100 * 100) / 100 : 0
      }
    };
  }

  /**
   * Get current performance summary
   */
  getCurrentPerformanceSummary() {
    const recentMetrics = this.metricsHistory.slice(-10); // Last 10 measurements
    
    if (recentMetrics.length === 0) {
      return { message: 'No recent metrics available' };
    }

    const latest = recentMetrics[recentMetrics.length - 1];
    const averages = this.calculateDailyAverages(recentMetrics);
    
    return {
      timestamp: latest.timestamp,
      current: {
        memory: latest.memory,
        cpu: latest.cpu,
        responseTime: latest.responseTime,
        uptime: Math.round(latest.uptime / 3600 * 100) / 100 // hours
      },
      recent: averages.averages,
      baseline: this.baselineMetrics,
      alerts: this.checkThresholds(latest),
      status: this.getOverallStatus(latest)
    };
  }

  /**
   * Get overall system status based on metrics
   */
  getOverallStatus(metrics) {
    const alerts = this.checkThresholds(metrics);
    const criticalAlerts = alerts.filter(a => a.type === 'CRITICAL');
    const warningAlerts = alerts.filter(a => a.type === 'WARNING');

    if (criticalAlerts.length > 0) {
      return 'CRITICAL';
    } else if (warningAlerts.length > 0) {
      return 'WARNING';
    } else {
      return 'HEALTHY';
    }
  }

  /**
   * Get metrics for API endpoint
   */
  getMetricsForAPI() {
    return {
      current: this.getCurrentPerformanceSummary(),
      baseline: this.baselineMetrics,
      history: this.metricsHistory.slice(-20), // Last 20 measurements
      thresholds: this.performanceThresholds
    };
  }

  /**
   * Update request metrics from monitoring middleware
   */
  updateRequestMetrics(requestData) {
    try {
      const { duration, statusCode, path, method } = requestData;
      
      // Update global request metrics
      if (!global.requestMetrics) {
        global.requestMetrics = {
          total: 0,
          perSecond: 0,
          active: 0,
          responseTimes: []
        };
      }
      
      // Update response times for performance calculation
      global.requestMetrics.responseTimes.push(duration);
      
      // Keep only last 1000 response times for memory efficiency
      if (global.requestMetrics.responseTimes.length > 1000) {
        global.requestMetrics.responseTimes = global.requestMetrics.responseTimes.slice(-1000);
      }
      
      // Update error metrics if status code indicates error
      if (statusCode >= 400) {
        if (!global.errorMetrics) {
          global.errorMetrics = {
            total: 0,
            rate: 0,
            last24h: 0
          };
        }
        global.errorMetrics.total++;
      }
      
      // Log slow requests
      if (duration > this.performanceThresholds.responseTime.warning) {
        logger.warn(`Slow request detected: ${method} ${path} took ${duration}ms`);
      }
      
    } catch (error) {
      logger.error('Error updating request metrics:', error);
    }
  }

  /**
   * Add frontend metrics to centralized monitoring
   */
  addFrontendMetrics(frontendData) {
    try {
      const { timestamp, url, userAgent, metrics } = frontendData;
      
      // Store frontend metrics in a separate array
      if (!this.frontendMetrics) {
        this.frontendMetrics = [];
      }
      
      this.frontendMetrics.push({
        timestamp,
        url,
        userAgent,
        webVitals: metrics.webVitals,
        navigation: metrics.navigation,
        resources: metrics.resources,
        memory: metrics.memory,
        connection: metrics.connection
      });
      
      // Keep only last 1000 frontend metrics for memory efficiency
      if (this.frontendMetrics.length > 1000) {
        this.frontendMetrics = this.frontendMetrics.slice(-1000);
      }
      
      // Log significant performance issues
      if (metrics.webVitals?.lcp > 4000) {
        logger.warn(`Poor LCP detected on frontend: ${metrics.webVitals.lcp}ms for ${url}`);
      }
      
      if (metrics.navigation?.loadTime > 5000) {
        logger.warn(`Slow page load detected: ${metrics.navigation.loadTime}ms for ${url}`);
      }
      
    } catch (error) {
      logger.error('Error adding frontend metrics:', error);
    }
  }

  /**
   * Get frontend metrics summary
   */
  getFrontendMetrics() {
    if (!this.frontendMetrics || this.frontendMetrics.length === 0) {
      return null;
    }
    
    // Calculate averages and summaries
    const recent = this.frontendMetrics.slice(-100); // Last 100 entries
    
    const avgFCP = recent
      .filter(m => m.webVitals?.fcp)
      .reduce((sum, m, _, arr) => sum + m.webVitals.fcp / arr.length, 0);
      
    const avgLCP = recent
      .filter(m => m.webVitals?.lcp)
      .reduce((sum, m, _, arr) => sum + m.webVitals.lcp / arr.length, 0);
      
    const avgLoadTime = recent
      .filter(m => m.navigation?.loadTime)
      .reduce((sum, m, _, arr) => sum + m.navigation.loadTime / arr.length, 0);
      return {
      totalEntries: this.frontendMetrics.length,
      recentEntries: recent.length,
      averages: {
        fcp: Math.round(avgFCP),
        lcp: Math.round(avgLCP),
        loadTime: Math.round(avgLoadTime)
      },
      lastUpdate: recent[recent.length - 1]?.timestamp || null
    };
  }

  /**
   * Get baseline metrics
   */
  getBaseline() {
    return this.baselineMetrics;
  }

  /**
   * Compare current metrics to baseline
   */
  compareToBaseline() {
    if (!this.baselineMetrics || Object.keys(this.baselineMetrics).length === 0) {
      return null;
    }

    const current = this.metricsHistory[this.metricsHistory.length - 1];
    if (!current) {
      return null;
    }

    const comparison = {
      timestamp: Date.now(),
      improvements: [],
      regressions: [],
      stable: [],
      overall: 'unknown'
    };

    // Compare key metrics
    const metrics = ['responseTime', 'memoryUsage', 'cpuUsage', 'errorRate'];
    
    metrics.forEach(metric => {
      const baselineValue = this.baselineMetrics[metric];
      const currentValue = current[metric];
      
      if (baselineValue && currentValue !== undefined) {
        const difference = ((currentValue - baselineValue) / baselineValue) * 100;
        
        if (Math.abs(difference) < 5) {
          comparison.stable.push({
            metric,
            baseline: baselineValue,
            current: currentValue,
            change: difference.toFixed(2) + '%'
          });
        } else if (difference < 0) {
          comparison.improvements.push({
            metric,
            baseline: baselineValue,
            current: currentValue,
            change: difference.toFixed(2) + '%'
          });
        } else {
          comparison.regressions.push({
            metric,
            baseline: baselineValue,
            current: currentValue,
            change: difference.toFixed(2) + '%'
          });
        }
      }
    });

    // Determine overall status
    if (comparison.regressions.length === 0) {
      comparison.overall = 'improved';
    } else if (comparison.improvements.length >= comparison.regressions.length) {
      comparison.overall = 'mixed';
    } else {
      comparison.overall = 'degraded';
    }

    return comparison;
  }

  /**
   * Check performance thresholds and generate alerts
   */
  checkThresholds(currentMetrics) {
    const alerts = [];

    if (!currentMetrics) {
      return alerts;
    }

    // Check response time
    if (currentMetrics.responseTime > this.performanceThresholds.responseTime.critical) {
      alerts.push({
        type: 'CRITICAL',
        metric: 'responseTime',
        value: currentMetrics.responseTime,
        threshold: this.performanceThresholds.responseTime.critical,
        message: `Critical response time: ${currentMetrics.responseTime}ms`
      });
    } else if (currentMetrics.responseTime > this.performanceThresholds.responseTime.warning) {
      alerts.push({
        type: 'WARNING',
        metric: 'responseTime',
        value: currentMetrics.responseTime,
        threshold: this.performanceThresholds.responseTime.warning,
        message: `High response time: ${currentMetrics.responseTime}ms`
      });
    }

    // Check memory usage
    if (currentMetrics.memoryUsage > this.performanceThresholds.memoryUsage.critical) {
      alerts.push({
        type: 'CRITICAL',
        metric: 'memoryUsage',
        value: currentMetrics.memoryUsage,
        threshold: this.performanceThresholds.memoryUsage.critical,
        message: `Critical memory usage: ${currentMetrics.memoryUsage}%`
      });
    } else if (currentMetrics.memoryUsage > this.performanceThresholds.memoryUsage.warning) {
      alerts.push({
        type: 'WARNING',
        metric: 'memoryUsage',
        value: currentMetrics.memoryUsage,
        threshold: this.performanceThresholds.memoryUsage.warning,
        message: `High memory usage: ${currentMetrics.memoryUsage}%`
      });
    }

    // Check CPU usage
    if (currentMetrics.cpuUsage > this.performanceThresholds.cpuUsage.critical) {
      alerts.push({
        type: 'CRITICAL',
        metric: 'cpuUsage',
        value: currentMetrics.cpuUsage,
        threshold: this.performanceThresholds.cpuUsage.critical,
        message: `Critical CPU usage: ${currentMetrics.cpuUsage}%`
      });
    } else if (currentMetrics.cpuUsage > this.performanceThresholds.cpuUsage.warning) {
      alerts.push({
        type: 'WARNING',
        metric: 'cpuUsage',
        value: currentMetrics.cpuUsage,
        threshold: this.performanceThresholds.cpuUsage.warning,
        message: `High CPU usage: ${currentMetrics.cpuUsage}%`
      });
    }

    // Check error rate
    if (currentMetrics.errorRate > this.performanceThresholds.errorRate.critical) {
      alerts.push({
        type: 'CRITICAL',
        metric: 'errorRate',
        value: currentMetrics.errorRate,
        threshold: this.performanceThresholds.errorRate.critical,
        message: `Critical error rate: ${currentMetrics.errorRate}%`
      });
    } else if (currentMetrics.errorRate > this.performanceThresholds.errorRate.warning) {
      alerts.push({
        type: 'WARNING',
        metric: 'errorRate',
        value: currentMetrics.errorRate,
        threshold: this.performanceThresholds.errorRate.warning,
        message: `High error rate: ${currentMetrics.errorRate}%`
      });
    }

    return alerts;
  }
}

export default PerformanceMetricsService;
