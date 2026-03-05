import { Router } from 'express';
import { db, auth } from '../config/firebase-config.js';
import asyncHandler from '../middleware/asyncHandler.js';
import validate from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.js';
import { AppError, ConflictError } from '../errors/AppError.js';

const router = Router();

// POST /api/auth/register (Para registro público inicial)
// Si necesitas crear usuarios desde ADMIN, usa POST /api/users
router.post(
    '/register',
    validate(registerSchema),
    asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        try {
            // 1. Crear el usuario en Firebase Authentication
            const userRecord = await auth.createUser({
                email,
                password,
            });

            // 2. Crear el documento base en Firestore (Colección users)
            await db.collection('users').doc(userRecord.uid).set({
                email: userRecord.email,
                role: 'user', // Default rol
                createdAt: new Date().toISOString()
            });

            res.status(201).json({ id: userRecord.uid, email });
        } catch (err) {
            if (err.code === 'auth/email-already-exists') {
                throw new ConflictError('Email already exists');
            }
            throw new AppError('Error creating user: ' + err.message, 500);
        }
    })
);

// En Firebase, el Login y Logout lo maneja directamente el SDK Frontend (signInWithEmailAndPassword).
// Ya no necesitamos endpoints de sesión manuales en el backend que generen JWTs
// ni borren cookies porque Firebase maneja sus propios tokens de persistencia de sesión.
// Se dejan solo por si quieres inyectar Claims personalizados al token en un futuro.

router.post('/login', (req, res) => {
    res.status(200).json({ message: "Por favor usa el SDK de Firebase Cliente para inicar sesión." });
});

router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

export default router;
