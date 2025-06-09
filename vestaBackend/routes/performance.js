import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { getMetrics, getPerformanceMetricsService } from '../utils/monitoring.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/performance/metrics
 * Get current performance metrics (admin only)
 */
router.get('/metrics', adminAuth, async (req, res) => {  try {
    const basicMetrics = getMetrics();
    const performanceService = getPerformanceMetricsService();
    
    let enhancedMetrics = null;
    if (performanceService) {
      enhancedMetrics = await performanceService.collectCurrentMetrics();
    }
    
    res.json({
      timestamp: Date.now(),
      basic: basicMetrics,
      enhanced: enhancedMetrics,
      status: 'active'
    });
  } catch (error) {
    logger.error('Error retrieving performance metrics:', error);
    res.status(500).json({
      error: 'METRICS_RETRIEVAL_FAILED',
      message: 'Failed to retrieve performance metrics'
    });
  }
});

/**
 * GET /api/performance/baseline
 * Get baseline performance metrics (admin only)
 */
router.get('/baseline', adminAuth, async (req, res) => {
  try {
    const performanceService = getPerformanceMetricsService();
    
    if (!performanceService) {
      return res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        message: 'Performance metrics service not initialized'
      });
    }
    
    const baseline = performanceService.getBaseline();
    res.json({
      baseline,
      hasBaseline: Object.keys(baseline).length > 0
    });
  } catch (error) {
    logger.error('Error retrieving baseline metrics:', error);
    res.status(500).json({
      error: 'BASELINE_RETRIEVAL_FAILED',
      message: 'Failed to retrieve baseline metrics'
    });
  }
});

/**
 * POST /api/performance/baseline/establish
 * Establish new baseline (admin only)
 */
router.post('/baseline/establish', adminAuth, async (req, res) => {
  try {
    const performanceService = getPerformanceMetricsService();
    
    if (!performanceService) {
      return res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        message: 'Performance metrics service not initialized'
      });
    }
    
    logger.info('Baseline establishment requested by admin', {
      adminId: req.admin._id,
      email: req.admin.email
    });
    
    // Start baseline establishment
    performanceService.establishBaseline();
    
    res.json({
      message: 'Baseline establishment started',
      duration: '5 minutes',
      status: 'in_progress'
    });
  } catch (error) {
    logger.error('Error establishing baseline:', error);
    res.status(500).json({
      error: 'BASELINE_ESTABLISHMENT_FAILED',
      message: 'Failed to establish baseline'
    });
  }
});

/**
 * GET /api/performance/comparison
 * Compare current metrics to baseline (admin only)
 */
router.get('/comparison', adminAuth, async (req, res) => {
  try {
    const performanceService = getPerformanceMetricsService();
    
    if (!performanceService) {
      return res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        message: 'Performance metrics service not initialized'
      });    }
    
    const current = await performanceService.collectCurrentMetrics();
    const comparison = performanceService.compareToBaseline();
    
    res.json({
      current,
      baseline: performanceService.getBaseline(),
      comparison,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error performing baseline comparison:', error);
    res.status(500).json({
      error: 'COMPARISON_FAILED',
      message: 'Failed to compare with baseline'
    });
  }
});

/**
 * GET /api/performance/history
 * Get performance metrics history (admin only)
 */
router.get('/history', adminAuth, async (req, res) => {
  try {
    const { limit = 100, hours = 24 } = req.query;
    const performanceService = getPerformanceMetricsService();
    
    if (!performanceService) {
      return res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        message: 'Performance metrics service not initialized'
      });
    }
    
    const history = performanceService.getMetricsHistory();
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    
    // Filter by time and limit
    const filteredHistory = history
      .filter(metric => metric.timestamp >= cutoffTime)
      .slice(-limit);
    
    res.json({
      history: filteredHistory,
      totalEntries: filteredHistory.length,
      timeRange: `${hours} hours`,
      limit: parseInt(limit)
    });
  } catch (error) {
    logger.error('Error retrieving metrics history:', error);
    res.status(500).json({
      error: 'HISTORY_RETRIEVAL_FAILED',
      message: 'Failed to retrieve metrics history'
    });
  }
});

/**
 * POST /api/performance/report/daily
 * Generate daily performance report (admin only)
 */
router.post('/report/daily', adminAuth, async (req, res) => {
  try {
    const performanceService = getPerformanceMetricsService();
    
    if (!performanceService) {
      return res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        message: 'Performance metrics service not initialized'
      });
    }
    
    const report = await performanceService.generateDailyReport();
    
    logger.info('Daily performance report generated', {
      adminId: req.admin._id,
      reportDate: report.date
    });
    
    res.json({
      message: 'Daily report generated successfully',
      report
    });
  } catch (error) {
    logger.error('Error generating daily report:', error);
    res.status(500).json({
      error: 'REPORT_GENERATION_FAILED',
      message: 'Failed to generate daily report'
    });
  }
});

/**
 * GET /api/performance/alerts
 * Get current performance alerts (admin only)
 */
router.get('/alerts', adminAuth, async (req, res) => {
  try {
    const performanceService = getPerformanceMetricsService();
    
    if (!performanceService) {
      return res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        message: 'Performance metrics service not initialized'
      });    }
    
    const current = await performanceService.collectCurrentMetrics();
    const alerts = performanceService.checkThresholds(current);
    
    res.json({
      alerts,
      alertCount: alerts.length,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error retrieving performance alerts:', error);
    res.status(500).json({
      error: 'ALERTS_RETRIEVAL_FAILED',
      message: 'Failed to retrieve performance alerts'
    });
  }
});

/**
 * GET /api/performance/health
 * Get overall system health status
 */
router.get('/health', async (req, res) => {
  try {
    const basicMetrics = getMetrics();
    const performanceService = getPerformanceMetricsService();
    
    let status = 'healthy';
    let issues = [];
    
    // Check basic health indicators
    if (basicMetrics.memory > 900) {
      status = 'warning';
      issues.push('High memory usage');
    }
    
    if (basicMetrics.cpu > 80) {
      status = 'critical';
      issues.push('High CPU usage');
    }
      if (basicMetrics.latency > 1000) {
      status = 'warning';
      issues.push('High response time');
    }
    
    // Enhanced checks if service is available
    if (performanceService) {
      const current = await performanceService.collectCurrentMetrics();
      const alerts = performanceService.checkThresholds(current);
      
      if (alerts.length > 0) {
        const criticalAlerts = alerts.filter(alert => alert.type === 'CRITICAL');
        if (criticalAlerts.length > 0) {
          status = 'critical';
        } else if (status === 'healthy') {
          status = 'warning';
        }
        
        issues.push(...alerts.map(alert => alert.message));
      }
    }
    
    res.json({
      status,
      uptime: process.uptime(),
      memory: basicMetrics.memory,
      cpu: basicMetrics.cpu,
      issues,
      timestamp: Date.now(),
      serviceAvailable: !!performanceService
    });
  } catch (error) {
    logger.error('Error checking system health:', error);
    res.status(500).json({
      status: 'error',
      error: 'HEALTH_CHECK_FAILED',
      message: 'Failed to check system health'
    });
  }
});

/**
 * POST /api/performance/frontend-metrics
 * Receive frontend performance metrics (from Angular app)
 */
router.post('/frontend-metrics', async (req, res) => {
  try {
    const { metrics, userAgent, url, timestamp } = req.body;
    
    // Log frontend metrics
    logger.info('Frontend performance metrics received', {
      url,
      userAgent: userAgent?.substring(0, 100), // Truncate for logging
      metrics: {
        fcp: metrics.webVitals?.fcp,
        lcp: metrics.webVitals?.lcp,
        loadTime: metrics.navigation?.loadTime,
        resourceCount: metrics.resources?.totalResources
      },
      timestamp
    });
    
    // Store frontend metrics (could be saved to database or file)
    const performanceService = getPerformanceMetricsService();
    if (performanceService) {
      // Add frontend metrics to the service for centralized monitoring
      performanceService.addFrontendMetrics({
        timestamp,
        url,
        userAgent,
        metrics
      });
    }
    
    res.json({
      message: 'Frontend metrics received successfully',
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error processing frontend metrics:', error);
    res.status(500).json({
      error: 'FRONTEND_METRICS_FAILED',
      message: 'Failed to process frontend metrics'
    });
  }
});

export default router;
