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

        // Obtener rol del usuario desde Firestore (ya que FB Auth no guarda "roles" custom por defecto)
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const role = userDoc.exists ? userDoc.data().role : 'user';

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: role
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
