import { AppError } from '../errors/AppError.js';
import config from '../config/env.js';

/**
 * Global error handling middleware.
 * Must be registered LAST, after all routes.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
    // Default to 500 Internal Server Error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let details = err.details || undefined;

    // Log the error
    if (statusCode >= 500) {
        console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
    } else {
        console.warn(`[WARN] ${req.method} ${req.originalUrl}: ${message}`);
    }

    // In production, don't leak internal error details
    if (statusCode >= 500 && config.isProduction) {
        message = 'Internal Server Error';
        details = undefined;
    }

    res.status(statusCode).json({
        error: true,
        message,
        ...(details && { details }),
        ...(!config.isProduction && statusCode >= 500 && { stack: err.stack }),
    });
};

export default errorHandler;
