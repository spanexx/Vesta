import dotenv from 'dotenv';
dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
    corsOrigins: process.env.CORS_ORIGINS ? 
        process.env.CORS_ORIGINS.split(',') : 
        ['http://localhost:4200', 'http://localhost:6388', 'https://vesta.spanexx.com'],
    maxFileSize: process.env.MAX_FILE_SIZE || '10mb',
    
    // Enhanced rate limiting configuration
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.NODE_ENV === 'production' ? 100 : 1000,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false, // Count successful requests against the limit
        keyGenerator: (req) => req.ip // Use IP for rate limiting
    },

    // Monitoring thresholds
    monitoring: {
        memory: {
            warnThreshold: '800MB',
            errorThreshold: '900MB',
            restartThreshold: '1GB'
        },
        cpu: {
            warnThreshold: 70, // 70% CPU usage
            errorThreshold: 85, // 85% CPU usage
        },
        requests: {
            errorRateThreshold: 0.05 // 5% error rate threshold
        }
    },

    // Cache settings
    cache: {
        staticFiles: {
            maxAge: process.env.NODE_ENV === 'production' ? '30d' : '0',
            immutable: process.env.NODE_ENV === 'production'
        },
        api: {
            maxAge: process.env.NODE_ENV === 'production' ? '1h' : '0'
        }
    },

    // Security settings
    security: {
        nodeEnv: process.env.NODE_ENV || 'development',
        compression: process.env.NODE_ENV === 'production',
        trustProxy: process.env.NODE_ENV === 'production'
    },

    // Backup configuration
    backup: {
        enabled: process.env.NODE_ENV === 'production',
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
        interval: parseInt(process.env.BACKUP_INTERVAL_HOURS || '24'),
        path: './backups'
    }
};