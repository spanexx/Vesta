import io from '@pm2/io';
import { config } from '../config/config.js';
import logger from './logger.js';
import { PerformanceMetricsService } from '../services/PerformanceMetricsService.js';

// Initialize enhanced performance metrics service
let performanceMetricsService;

// Initialize metrics first
const metrics = {
  requestsTotal: io.counter('Total Requests'),
  activeConnections: io.counter('Active Connections'),
  responseTime: io.metric({
    name: 'Response Time',
    type: 'histogram',
    measurement: 'mean'
  }),
  errorCount: io.counter('Error Count'),
  lastError: io.metric({
    name: 'Last Error',
    type: 'metric'
  }),
  errorRate: io.meter({
    name: 'Error Rate',
    timeframe: 60  // Calculate error rate over 1 minute
  }),
  memoryUsage: io.metric({
    name: 'Memory Usage (MB)',
    type: 'metric',
    value: () => process.memoryUsage().heapUsed / 1024 / 1024
  }),
  cpuUsage: io.metric({
    name: 'CPU Usage (%)',
    type: 'metric',
    value: () => {
      const cpuUsage = process.cpuUsage();
      return (cpuUsage.user + cpuUsage.system) / 1000000;
    }
  })
};

// Alert thresholds
const thresholds = {
  memory: {
    warning: parseInt(config.monitoring?.memory?.warnThreshold) || 1024,
    critical: parseInt(config.monitoring?.memory?.errorThreshold) || 2048
  },
  cpu: {
    warning: config.monitoring?.cpu?.warnThreshold || 70,
    critical: config.monitoring?.cpu?.errorThreshold || 90
  },
  errorRate: config.monitoring?.requests?.errorRateThreshold || 0.1,
  responseTime: 1000 // 1 second
};

// Monitoring middleware
export const monitorRequest = (req, res, next) => {
  const startTime = Date.now();
  
  metrics.requestsTotal.inc();
  metrics.activeConnections.inc();
  
  req.trackingId = Math.random().toString(36).substring(7);
  
  // Initialize request metrics globally if not exists
  if (!global.requestMetrics) {
    global.requestMetrics = {
      total: 0,
      perSecond: 0,
      active: 0,
      responseTimes: []
    };
  }
  
  global.requestMetrics.total++;
  global.requestMetrics.active++;
  
  res.once('finish', () => {
    const duration = Date.now() - startTime;
    
    try {
      metrics.responseTime.set(duration);
      metrics.activeConnections.dec();
      global.requestMetrics.active--;
      global.requestMetrics.responseTimes.push(duration);
      
      // Keep only last 100 response times for performance
      if (global.requestMetrics.responseTimes.length > 100) {
        global.requestMetrics.responseTimes = global.requestMetrics.responseTimes.slice(-100);
      }

      if (res.statusCode >= 400) {
        metrics.errorCount.inc();
        metrics.errorRate.mark();
        
        // Initialize error metrics globally if not exists
        if (!global.errorMetrics) {
          global.errorMetrics = {
            total: 0,
            rate: 0,
            last24h: 0
          };
        }
        
        global.errorMetrics.total++;
        
        if (res.statusCode >= 500) {
          metrics.lastError.set(`${res.statusCode} error on ${req.method} ${req.path}`);
        }
      }

      if (duration > thresholds.responseTime) {
        logger.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
      }

      const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
      const cpuUsage = process.cpuUsage();
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000;

      if (memUsage > thresholds.memory.critical) {
        logger.error(`Critical memory usage: ${memUsage.toFixed(2)}MB`);
      } else if (memUsage > thresholds.memory.warning) {
        logger.warn(`High memory usage: ${memUsage.toFixed(2)}MB`);
      }

      if (cpuPercent > thresholds.cpu.critical) {
        logger.error(`Critical CPU usage: ${cpuPercent.toFixed(2)}%`);
      } else if (cpuPercent > thresholds.cpu.warning) {
        logger.warn(`High CPU usage: ${cpuPercent.toFixed(2)}%`);
      }
      
      // Update performance metrics service if available
      if (performanceMetricsService) {
        performanceMetricsService.updateRequestMetrics({
          duration,
          statusCode: res.statusCode,
          path: req.path,
          method: req.method
        });
      }
    } catch (err) {
      logger.error('Error in monitoring middleware:', err);
    }
  });

  next();
};

// PM2 custom metrics
io.metric({
  name: 'Uptime',
  type: 'metric',
  value: () => process.uptime()
});

// Custom actions
io.action('gc', (reply) => {
  if (global.gc) {
    global.gc();
    reply({ success: true, message: 'Manual garbage collection triggered' });
  } else {
    reply({ success: false, message: 'Garbage collection not exposed' });
  }
});

io.action('getMetrics', (reply) => {
  reply({
    memory: metrics.memoryUsage.value(),
    cpu: metrics.cpuUsage.value(),
    requests: metrics.requestsTotal.val,
    errors: metrics.errorCount.val,
    activeConnections: metrics.activeConnections.val,
    uptime: process.uptime()
  });
});

// Export metrics for external use
export const getMetrics = () => ({
  timestamp: Date.now(),
  memory: metrics.memoryUsage.value(),
  cpu: metrics.cpuUsage.value(),
  requests: metrics.requestsTotal.val,
  errors: metrics.errorCount.val,
  activeConnections: metrics.activeConnections.val,
  latency: metrics.responseTime.mean,
  uptime: process.uptime()
});

// Initialize performance metrics service
export const initializePerformanceMetrics = () => {
  try {
    performanceMetricsService = new PerformanceMetricsService();
    logger.info('Performance metrics service initialized successfully');
    return performanceMetricsService;
  } catch (error) {
    logger.error('Failed to initialize performance metrics service:', error);
    return null;
  }
};

// Get performance metrics service instance
export const getPerformanceMetricsService = () => performanceMetricsService;

export default metrics;