import { auth, db } from '../config/firebase-config.js';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';

/**
 * Verifies Firebase ID token from Authorization header or cookie.
 * Attaches decoded user and its Firestore permissions role to req.user.
 */
export const verifyToken = async (req, res, next) => {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];
    const token = cookieToken || headerToken;

    if (!token) {
        return next(new UnauthorizedError('Access token is required'));
    }

    try {
        // Obtenemos info del token desde Firebase directamente
        const decodedToken = await auth.verifyIdToken(token);

        // Obtener rol y companyId del usuario desde Firestore
        // IMPORTANTE: companyId NUNCA viene del cliente, siempre de la DB
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (!userDoc.exists) {
            return next(new UnauthorizedError('User account not found or has been deleted'));
        }
        const userData = userDoc.data();
        const role = userData.role || 'user';
        const companyId = userData.companyId || null;
        const permissions = userData.permissions || [];

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role,
            companyId,
            permissions,
        };
        next();
    } catch (err) {
        return next(new UnauthorizedError('Invalid or expired Firebase token'));
    }
};

/**
 * Role-based authorization middleware factory.
 * Usage: authorize('admin', 'hr')
 */
export const authorize = (...roles) => {
    const flatRoles = roles.flat(); // Normaliza: soporta authorize('admin') y authorize(['admin', 'hr'])
    return (req, res, next) => {
        if (!req.user) {
            return next(new UnauthorizedError());
        }
        if (!flatRoles.includes(req.user.role)) {
            return next(new ForbiddenError(`Role '${req.user.role}' is not authorized for this action`));
        }
        next();
    };
};

/**
 * Permission-based authorization middleware.
 * Usage: requirePermission(PERMISSIONS.MANAGE_DOCUMENTS)
 */
export const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new UnauthorizedError());
        }
        
        // Super admins and admins override all granular permissions
        if (req.user.role === 'super_admin' || req.user.role === 'admin') {
            return next();
        }

        const userPerms = req.user.permissions || [];
        if (!userPerms.includes(permission)) {
            return next(new ForbiddenError('User does not have required permissions'));
        }
        next();
    };
};
