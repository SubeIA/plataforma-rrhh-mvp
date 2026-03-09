import { Router } from 'express';
import { db } from '../config/firebase-config.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
    punchSchema,
    manualAttendanceSchema,
    updateAttendanceSchema,
} from '../validators/attendance.js';
import { AppError } from '../errors/AppError.js';
import { calculateDailyAttendance } from '../utils/attendanceCalculator.js';
import { ROLES, PRIVILEGED_ROLES } from '../constants/roles.js';

const router = Router();

// POST /api/attendance — Punch IN/OUT (con transacción para evitar race conditions)
router.post(
    '/',
    verifyToken,
    validate(punchSchema),
    asyncHandler(async (req, res) => {
        const { type, lat, lng, accuracy } = req.body;
        const userId = req.user.uid;

        if (lat == null || lng == null) {
            throw new AppError('Se requiere ubicación GPS para registrar asistencia', 400);
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const timestampIso = new Date().toISOString();

        // Verificar Artículo 22
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists && userDoc.data().contract_type === 'Art22') {
            // Art 22 no requiere marcar, pero si lo hace se guarda sin cálculos estrictos
        }

        const dailyRecordId = `${userId}_${todayStr}`;
        const dailyRef = db.collection('daily_attendance').doc(dailyRecordId);

        // Usar transacción para evitar race conditions (doble punch)
        const result = await db.runTransaction(async (transaction) => {
            const dailySnap = await transaction.get(dailyRef);

            if (type === 'IN') {
                if (dailySnap.exists && dailySnap.data().entry_time) {
                    throw new AppError('Ya registraste tu entrada hoy', 400);
                }
                transaction.set(dailyRef, {
                    user_id: userId,
                    date: todayStr,
                    entry_time: timestampIso,
                    lat_in: lat,
                    lng_in: lng,
                    accuracy_in: accuracy || null,
                    is_manual_override: false,
                    companyId: req.user.companyId,
                    created_at: timestampIso,
                    updated_at: timestampIso
                }, { merge: true });

            } else if (type === 'OUT') {
                if (!dailySnap.exists || !dailySnap.data().entry_time) {
                    throw new AppError('Debes registrar tu entrada primero', 400);
                }
                if (dailySnap.data().exit_time) {
                    throw new AppError('Ya registraste tu salida hoy', 400);
                }

                const entryTime = dailySnap.data().entry_time;
                const calculations = calculateDailyAttendance(entryTime, timestampIso);

                transaction.update(dailyRef, {
                    exit_time: timestampIso,
                    lat_out: lat,
                    lng_out: lng,
                    accuracy_out: accuracy || null,
                    calculated_work_hours: calculations.calculatedWorkHours,
                    late_minutes: calculations.lateMinutes,
                    extra_minutes: calculations.extraMinutes,
                    updated_at: timestampIso
                });
            }

            return { id: dailyRecordId, type, timestamp: timestampIso };
        });

        res.status(201).json(result);
    })
);

// GET /api/attendance — List attendance (con batch reads para evitar N+1)
router.get(
    '/',
    verifyToken,
    asyncHandler(async (req, res) => {
        const isPrivileged = PRIVILEGED_ROLES.includes(req.user.role);
        let { userId, startDate, endDate } = req.query;

        let query = db.collection('attendance');

        if (!isPrivileged) {
            query = query.where('userId', '==', req.user.uid);
        } else if (userId) {
            query = query.where('userId', '==', userId);
        }

        if (startDate) {
            query = query.where('timestamp', '>=', startDate);
        }
        if (endDate) {
            query = query.where('timestamp', '<=', endDate);
        }

        query = query.orderBy('timestamp', 'desc').limit(100);
        const snapshot = await query.get();

        // Batch reads para evitar N+1 queries
        const userIdsSet = new Set(snapshot.docs.map(d => d.data().userId).filter(Boolean));
        const userIds = [...userIdsSet];

        const userMap = {};
        const profileMap = {};

        if (userIds.length > 0) {
            const userRefs = userIds.map(uid => db.collection('users').doc(uid));
            const profileRefs = userIds.map(uid => db.collection('profiles').doc(uid));

            const [userDocs, profileDocs] = await Promise.all([
                db.getAll(...userRefs),
                db.getAll(...profileRefs)
            ]);

            userDocs.forEach(doc => {
                if (doc.exists) userMap[doc.id] = doc.data();
            });
            profileDocs.forEach(doc => {
                if (doc.exists) profileMap[doc.id] = doc.data();
            });
        }

        const rows = snapshot.docs.map(doc => {
            const att = doc.data();
            return {
                id: doc.id,
                ...att,
                email: userMap[att.userId]?.email || null,
                fullName: profileMap[att.userId]?.fullName || null,
                department: profileMap[att.userId]?.department || null
            };
        });

        res.json(rows);
    })
);

// GET /api/attendance/history — User's recent history
router.get(
    '/history',
    verifyToken,
    asyncHandler(async (req, res) => {
        const snapshot = await db.collection('daily_attendance')
            .where('user_id', '==', req.user.uid)
            .orderBy('date', 'desc')
            .limit(10)
            .get();

        const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(rows);
    })
);

// GET /api/attendance/summary — Resumen histórico mensual con filtros
router.get(
    '/summary',
    verifyToken,
    asyncHandler(async (req, res) => {
        const { month_year } = req.query;
        const isPrivileged = req.user.role === ROLES.ADMIN || req.user.role === ROLES.JEFATURA;
        let targetUser = req.user.uid;

        if (isPrivileged && req.query.userId) {
            targetUser = req.query.userId;
        }

        let query = db.collection('daily_attendance')
            .where('user_id', '==', targetUser);

        if (month_year) {
            query = query.where('date', '>=', `${month_year}-01`)
                .where('date', '<=', `${month_year}-31`);
        }

        query = query.orderBy('date', 'desc').limit(50);
        const snapshot = await query.get();

        const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(rows);
    })
);

// GET /api/attendance/admin-summary — Admin: Resumen histórico mensual global (con batch reads)
router.get(
    '/admin-summary',
    verifyToken,
    authorize(ROLES.ADMIN, ROLES.HR),
    asyncHandler(async (req, res) => {
        const { month_year } = req.query;

        let query = db.collection('daily_attendance')
            .where('companyId', '==', req.user.companyId);

        if (month_year) {
            query = query.where('date', '>=', `${month_year}-01`)
                .where('date', '<=', `${month_year}-31`);
        }

        query = query.orderBy('date', 'desc').limit(100);
        const snapshot = await query.get();

        // Batch read de usuarios para evitar N+1
        const userIdsSet = new Set(snapshot.docs.map(d => d.data().user_id).filter(Boolean));
        const userIds = [...userIdsSet];

        const userMap = {};
        if (userIds.length > 0) {
            const userRefs = userIds.map(uid => db.collection('users').doc(uid));
            const userDocs = await db.getAll(...userRefs);
            userDocs.forEach(doc => {
                if (doc.exists) userMap[doc.id] = doc.data();
            });
        }

        const rows = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                user_email: userMap[data.user_id]?.email || 'Unknown',
                user_name: userMap[data.user_id]?.name || 'Unknown'
            };
        });

        res.json(rows);
    })
);

// POST /api/attendance/manual — HR/Admin: Excepción / Edición Justificada
router.post(
    '/manual',
    verifyToken,
    authorize(ROLES.ADMIN, ROLES.HR),
    validate(manualAttendanceSchema),
    asyncHandler(async (req, res) => {
        const { userId, date, entry_time, exit_time } = req.body;

        const dailyRecordId = `${userId}_${date}`;
        const calculations = exit_time && entry_time
            ? calculateDailyAttendance(entry_time, exit_time)
            : { calculatedWorkHours: 0, lateMinutes: 0, extraMinutes: 0 };

        await db.collection('daily_attendance').doc(dailyRecordId).set({
            user_id: userId,
            date,
            entry_time: entry_time || null,
            exit_time: exit_time || null,
            is_manual_override: true,
            companyId: req.user.companyId,
            calculated_work_hours: calculations.calculatedWorkHours,
            late_minutes: calculations.lateMinutes,
            extra_minutes: calculations.extraMinutes,
            updated_at: new Date().toISOString()
        }, { merge: true });

        await db.collection('audit_log').add({
            userId: req.user.uid,
            action: 'MANUAL_ENTRY_HXM',
            tableName: 'daily_attendance',
            recordId: dailyRecordId,
            details: JSON.stringify({ targetUserId: userId, date, entry_time, exit_time }),
            timestamp: new Date().toISOString()
        });

        res.status(201).json({ id: dailyRecordId, message: 'Record overridden manually' });
    })
);

// PUT /api/attendance/:id — HR/Admin: correct record
router.put(
    '/:id',
    verifyToken,
    authorize(ROLES.ADMIN, ROLES.HR),
    validate(updateAttendanceSchema),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { type, timestamp } = req.body;

        await db.collection('attendance').doc(id).update({
            type,
            timestamp
        });

        await db.collection('audit_log').add({
            userId: req.user.uid,
            action: 'CORRECTION',
            tableName: 'attendance',
            recordId: id,
            details: JSON.stringify({ type, timestamp }),
            timestamp: new Date().toISOString()
        });

        res.json({ message: 'Record updated successfully' });
    })
);

export default router;
