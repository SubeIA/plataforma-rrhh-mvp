import { Router } from 'express';
import { db, auth } from '../config/firebase-config.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import { AppError, ConflictError } from '../errors/AppError.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// POST /api/companies — super_admin crea una empresa nueva + su primer usuario admin
router.post(
    '/',
    verifyToken,
    authorize(ROLES.SUPER_ADMIN),
    asyncHandler(async (req, res) => {
        const { name, rut, plan = 'starter', adminEmail, adminPassword } = req.body;

        if (!name || !adminEmail || !adminPassword) {
            throw new AppError('name, adminEmail y adminPassword son requeridos', 400);
        }

        // 1. Verificar que no exista otra empresa con el mismo RUT
        if (rut) {
            const existing = await db.collection('companies').where('rut', '==', rut).limit(1).get();
            if (!existing.empty) {
                throw new ConflictError(`Ya existe una empresa con el RUT ${rut}`);
            }
        }

        // 2. Crear empresa en Firestore
        const companyRef = await db.collection('companies').add({
            name,
            rut: rut || null,
            plan,
            adminEmail,
            active: true,
            createdAt: new Date().toISOString(),
        });

        const companyId = companyRef.id;

        // 3. Crear usuario admin en Firebase Auth
        let userRecord;
        try {
            userRecord = await auth.createUser({ email: adminEmail, password: adminPassword });
        } catch (err) {
            // Rollback: eliminar la empresa si no se pudo crear el usuario
            await companyRef.delete();
            if (err.code === 'auth/email-already-exists') {
                throw new ConflictError('Ya existe un usuario con ese email');
            }
            throw new AppError('Error creando usuario admin: ' + err.message, 500);
        }

        // 4. Crear documento de usuario con companyId y rol admin
        await db.collection('users').doc(userRecord.uid).set({
            email: adminEmail,
            role: ROLES.ADMIN,
            companyId,
            createdAt: new Date().toISOString(),
        });

        // 5. Actualizar empresa con el uid del admin
        await companyRef.update({ adminUid: userRecord.uid });

        res.status(201).json({
            companyId,
            companyName: name,
            adminUid: userRecord.uid,
            adminEmail,
            message: 'Empresa y usuario admin creados exitosamente',
        });
    })
);

// GET /api/companies/me — devuelve datos de la empresa del usuario autenticado
router.get(
    '/me',
    verifyToken,
    asyncHandler(async (req, res) => {
        if (!req.user.companyId) {
            throw new AppError('Este usuario no pertenece a ninguna empresa', 404);
        }

        const companyDoc = await db.collection('companies').doc(req.user.companyId).get();
        if (!companyDoc.exists) {
            throw new AppError('Empresa no encontrada', 404);
        }

        res.json({ id: companyDoc.id, ...companyDoc.data() });
    })
);

// GET /api/companies — super_admin lista todas las empresas
router.get(
    '/',
    verifyToken,
    authorize(ROLES.SUPER_ADMIN),
    asyncHandler(async (req, res) => {
        const snapshot = await db.collection('companies').orderBy('createdAt', 'desc').get();
        const companies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(companies);
    })
);

// POST /api/companies/users — admin crea un usuario dentro de su propia empresa
router.post(
    '/users',
    verifyToken,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (req, res) => {
        const { email, password, role = ROLES.USER, fullName, department } = req.body;

        if (!email || !password) {
            throw new AppError('email y password son requeridos', 400);
        }

        // El companyId siempre viene del token del admin, nunca del body
        const companyId = req.user.companyId;
        if (!companyId && req.user.role !== ROLES.SUPER_ADMIN) {
            throw new AppError('No tienes un companyId asignado', 400);
        }

        // admins solo pueden crear roles menores o iguales al suyo
        const allowedRoles = [ROLES.HR, ROLES.JEFATURA, ROLES.USER];
        if (req.user.role === ROLES.ADMIN && !allowedRoles.includes(role)) {
            throw new AppError(`No puedes crear usuarios con rol "${role}"`, 403);
        }

        let userRecord;
        try {
            userRecord = await auth.createUser({ email, password });
        } catch (err) {
            if (err.code === 'auth/email-already-exists') throw new ConflictError('Email ya en uso');
            throw new AppError('Error creando usuario: ' + err.message, 500);
        }

        await db.collection('users').doc(userRecord.uid).set({
            email,
            role,
            companyId,
            createdAt: new Date().toISOString(),
        });

        if (fullName || department) {
            await db.collection('profiles').doc(userRecord.uid).set({
                fullName: fullName || '',
                department: department || '',
                companyId,
                createdAt: new Date().toISOString(),
            });
        }

        await db.collection('audit_log').add({
            userId: req.user.uid,
            companyId,
            action: 'CREATE_USER',
            targetUid: userRecord.uid,
            targetEmail: email,
            timestamp: new Date().toISOString(),
        });

        res.status(201).json({
            uid: userRecord.uid,
            email,
            role,
            companyId,
        });
    })
);

export default router;
