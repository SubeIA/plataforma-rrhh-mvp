import { Router } from 'express';
import { db, auth } from '../config/firebase-config.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../constants/permissions.js';
import validate from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../validators/users.js';
import { ConflictError, AppError } from '../errors/AppError.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// GET /api/users — Admin/HR: list all users with profiles (cursor-based pagination)
router.get(
    '/',
    verifyToken,
    requirePermission(PERMISSIONS.MANAGE_USERS),
    asyncHandler(async (req, res) => {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const cursor = req.query.cursor;
        const companyId = req.user.companyId;

        let query = db.collection('users')
            .where('companyId', '==', companyId)
            .orderBy('__name__')
            .limit(limit + 1);

        if (cursor) {
            const cursorDoc = await db.collection('users').doc(cursor).get();
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc);
            }
        }

        const usersSnapshot = await query.get();
        const docs = usersSnapshot.docs;

        const hasMore = docs.length > limit;
        const pageDocs = hasMore ? docs.slice(0, limit) : docs;
        const nextCursor = hasMore ? pageDocs[pageDocs.length - 1].id : null;

        const profileRefs = pageDocs.map(d => db.collection('profiles').doc(d.id));
        const profileDocs = profileRefs.length > 0 ? await db.getAll(...profileRefs) : [];

        const users = pageDocs.map((userDoc, i) => {
            const userData = userDoc.data();
            const profileData = profileDocs[i]?.exists ? profileDocs[i].data() : {};
            return {
                id: userDoc.id,
                email: userData.email,
                role: userData.role,
                ...profileData,
            };
        });

        res.json({ users, nextCursor });
    })
);

// POST /api/users — Admin: create user & profile
router.post(
    '/',
    verifyToken,
    requirePermission(PERMISSIONS.MANAGE_USERS),
    validate(createUserSchema),
    asyncHandler(async (req, res) => {
        const { email, password, role, fullName, phone, address, department, position, startDate } = req.body;

        try {
            // 1. Crear en Firebase Auth
            const userRecord = await auth.createUser({ email, password });
            const userId = userRecord.uid;

            // 2. Crear documento de rol en Colección users
            await db.collection('users').doc(userId).set({
                email,
                role,
                companyId: req.user.companyId,
                createdAt: new Date().toISOString()
            });

            await db.collection('profiles').doc(userId).set({
                fullName,
                phone: phone || null,
                address: address || null,
                department: department || null,
                position: position || null,
                startDate: startDate || null,
                companyId: req.user.companyId
            });

            // Log format: (userId, action, tableName, recordId, details)
            await db.collection('audit_log').add({
                userId: req.user.uid,
                action: 'CREATE',
                tableName: 'users',
                recordId: userId,
                details: JSON.stringify({ email, role, fullName, department }),
                timestamp: new Date().toISOString()
            });

            res.status(201).json({ id: userId, email, role, fullName, department, position });
        } catch (err) {
            if (err.code === 'auth/email-already-exists') {
                throw new ConflictError('Error creating user/profile. Email might exist.');
            }
            throw new AppError('Server error creating user: ' + err.message, 500);
        }
    })
);

// PUT /api/users/:id — Admin: update user & profile
router.put(
    '/:id',
    verifyToken,
    requirePermission(PERMISSIONS.MANAGE_USERS),
    validate(updateUserSchema),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { email, role, fullName, phone, address, department, position, startDate } = req.body;

        // Verificar que el usuario pertenece a la misma empresa
        const targetUser = await db.collection('users').doc(id).get();
        if (!targetUser.exists) {
            throw new AppError('User not found', 404);
        }
        if (targetUser.data().companyId !== req.user.companyId) {
            throw new AppError('Cannot modify users from another company', 403);
        }

        try {
            // Actualizar el correo en Auth si se envió
            if (email) {
                await auth.updateUser(id, { email });
            }

            // Actualizar Colección Users (rol)
            await db.collection('users').doc(id).set({ role, email }, { merge: true });

            // Actualizar Colección Profiles
            await db.collection('profiles').doc(id).set({
                fullName,
                phone: phone || null,
                address: address || null,
                department: department || null,
                position: position || null,
                startDate: startDate || null
            }, { merge: true });

            await db.collection('audit_log').add({
                userId: req.user.uid,
                action: 'UPDATE',
                tableName: 'users',
                recordId: id,
                details: JSON.stringify({ email, role, fullName, department }),
                timestamp: new Date().toISOString()
            });

            res.json({ message: 'User updated successfully' });
        } catch (error) {
            throw new AppError('Error updating user: ' + error.message, 500);
        }
    })
);

// DELETE /api/users/:id — Admin: delete user
router.delete(
    '/:id',
    verifyToken,
    requirePermission(PERMISSIONS.MANAGE_USERS),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Verificar que el usuario pertenece a la misma empresa
        const targetUser = await db.collection('users').doc(id).get();
        if (!targetUser.exists) {
            throw new AppError('User not found', 404);
        }
        if (targetUser.data().companyId !== req.user.companyId) {
            throw new AppError('Cannot delete users from another company', 403);
        }

        try {
            // Borramos de Firebase Auth
            await auth.deleteUser(id);

            // Borramos documentos (users y profiles)
            await db.collection('users').doc(id).delete();
            await db.collection('profiles').doc(id).delete();

            await db.collection('audit_log').add({
                userId: req.user.uid,
                action: 'DELETE',
                tableName: 'users',
                recordId: id,
                details: "Deleted user",
                timestamp: new Date().toISOString()
            });

            res.json({ message: 'User deleted' });
        } catch (error) {
            throw new AppError('Error deleting user: ' + error.message, 500);
        }
    })
);

// GET /api/users/:id/shift — Get user's current shift
router.get(
    '/:id/shift',
    verifyToken,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        const isSelf = req.user.uid === id;
        const hasPermission = req.user.permissions?.includes(PERMISSIONS.MANAGE_SHIFTS) || req.user.permissions?.includes(PERMISSIONS.MANAGE_USERS);
        const isAdmin = req.user.role === ROLES.ADMIN || req.user.role === ROLES.SUPER_ADMIN;
        
        if (!isSelf && !hasPermission && !isAdmin) {
            throw new AppError('No tienes permisos para ver el turno de este usuario', 403);
        }

        const today = new Date().toISOString().split('T')[0];

        // Buscar en la subcolección o colección principal los user_shifts
        const userShiftsRef = db.collection('user_shifts');
        const snapshot = await userShiftsRef
            .where('userId', '==', id)
            .get();

        if (snapshot.empty) {
            return res.json(null);
        }

        // Ya que Firestore no soporta joins ni "OR" cruzados avanzados de fechas fácilmente sin índices robustos
        // Filtramos en memoria para este caso base (asumiendo que los turnos asignados no son millones por usuario al mismo tiempo)
        const shifts = snapshot.docs.map(d => ({ sysId: d.id, ...d.data() }));

        // Filtrar validos
        const validShift = shifts.find(us => {
            return !us.endDate || us.endDate >= today;
        });

        if (!validShift) return res.json(null);

        // Obtener la info del turno base
        const shiftDoc = await db.collection('shifts').doc(validShift.shiftId).get();
        if (!shiftDoc.exists) return res.json(null);

        res.json({
            ...shiftDoc.data(),
            id: shiftDoc.id,
            startDate: validShift.startDate,
            endDate: validShift.endDate
        });
    })
);

export default router;
