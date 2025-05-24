import { createLogger, format, transports } from 'winston';
import { config } from '../config/config.js';

const logger = createLogger({
    level: config.env === 'production' ? 'info' : 'debug',
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: 'vesta-backend' },
    transports: [
        new transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5,
        })
    ]
});

// Add console transport for non-production environments
if (config.env !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(),
            format.simple()
        )
    }));
}

export default logger;