import logger from '../utils/logger.js';
import { config } from '../config/config.js';

export const errorHandler = (err, req, res, next) => {
    // Log error details
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        user: req.user ? req.user.id : 'anonymous'
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: Object.values(err.errors).map(val => val.message)
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            error: `${field} already exists`
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expired'
        });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        error: config.env === 'production' ? 'Internal server error' : err.message,
        stack: config.env === 'production' ? undefined : err.stack
    });
};