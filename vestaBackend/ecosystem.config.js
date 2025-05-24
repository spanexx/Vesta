module.exports = {
  apps: [{
    name: 'vesta-backend',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    exp_backoff_restart_delay: 100,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 6388
    },
    error_file: './logs/pm2/error.log',
    out_file: './logs/pm2/out.log',
    log_file: './logs/pm2/combined.log',
    time: true,
    node_args: '--experimental-modules',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    log_type: 'json',
    force: true,

    // PM2 monitoring configuration
    monitoring: true,
    deep_monitoring: true,
    apm: {
      type: 'text',
      threshold: 1,
      ignore_routes: ['/health', '/metrics']
    },

    // Enhanced monitoring settings
    monit: {
      http: true,
      cpu: true,
      memory: true,
      dependencies: true
    },

    // Health check endpoint
    health_check: {
      url: 'http://localhost:6388/health'
    },

    // Alerting thresholds
    alert_thresholds: {
      memory_usage: 80,        // Alert at 80% memory usage
      cpu_usage: 70,           // Alert at 70% CPU usage
      http_latency: 1000,      // Alert on 1s+ latency
      error_rate: 5            // Alert on 5% error rate
    },

    // Restart settings
    autorestart: true,
    max_restarts: 10,
    min_uptime: '5m',
    listen_timeout: 8000,
    kill_timeout: 5000,

    // Graceful reload
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000,

    // Instance management
    instance_var: 'INSTANCE_ID',
    increment_var: 'PORT',
    restart_delay: 4000,

    // Source maps for better error reporting
    source_map_support: true,

    // Backup configuration (used by scheduled-backup.js)
    backup: {
      enabled: true,
      interval: 24,            // Hours between backups
      retention: 30,           // Days to keep backups
      path: './backups'
    }
  }],
  
  // Deploy configuration
  deploy: {
    production: {
      // MongoDB backup settings
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production && node scripts/backup-db.js',
      env: {
        NODE_ENV: 'production',
        BACKUP_RETENTION_DAYS: 30,
        BACKUP_INTERVAL_HOURS: 24
      }
    }
  }
}