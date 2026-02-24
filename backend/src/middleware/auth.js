import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';

/**
 * Verifies JWT token from httpOnly cookie or Authorization header (fallback).
 * Attaches decoded user to req.user.
 */
export const verifyToken = (req, res, next) => {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];
    const token = cookieToken || headerToken;

    if (!token) {
        throw new UnauthorizedError('Access token is required');
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    } catch (err) {
        throw new UnauthorizedError('Invalid or expired token');
    }
};

/**
 * Role-based authorization middleware factory.
 * Usage: authorize('admin', 'hr')
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new UnauthorizedError();
        }
        if (!roles.includes(req.user.role)) {
            throw new ForbiddenError(`Role '${req.user.role}' is not authorized for this action`);
        }
        next();
    };
};
