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

const router = Router();

// POST /api/attendance — Punch IN/OUT
router.post(
    '/',
    verifyToken,
    validate(punchSchema),
    asyncHandler(async (req, res) => {
        const { type, lat, lng, accuracy } = req.body;
        const userId = req.user.uid; // uid en vez de id por firebase

        if (lat == null || lng == null) {
            throw new AppError('Se requiere ubicación GPS para registrar asistencia', 400);
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const timestampIso = new Date().toISOString();

        // Verificar Artículo 22 (oculta exigencia de marcas)
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists && userDoc.data().contract_type === 'Art22') {
            // El usuario art 22 no requiere marcar, pero si lo hace, no calculamos atrasos ni retenciones estrictas
            // Por requerimiento "Omisión automática". Aún así dejaremos guardar la marca si quisieran.
        }

        // Usamos una combinación de userId_yyyy-mm-dd como ID del documento diario
        const dailyRecordId = `${userId}_${todayStr}`;
        const dailyRef = db.collection('daily_attendance').doc(dailyRecordId);
        const dailySnap = await dailyRef.get();

        if (type === 'IN') {
            // Registrar entrada
            if (dailySnap.exists && dailySnap.data().entry_time) {
                // Ya tiene entrada
                throw new AppError('Ya registraste tu entrada hoy', 400);
            }
            await dailyRef.set({
                user_id: userId,
                date: todayStr,
                entry_time: timestampIso,
                lat_in: lat,
                lng_in: lng,
                accuracy_in: accuracy || null,
                is_manual_override: false,
                created_at: timestampIso,
                updated_at: timestampIso
            }, { merge: true });

        } else if (type === 'OUT') {
            // Registrar salida
            if (!dailySnap.exists || !dailySnap.data().entry_time) {
                throw new AppError('Debes registrar tu entrada primero', 400);
            }
            if (dailySnap.data().exit_time) {
                throw new AppError('Ya registraste tu salida hoy', 400);
            }

            const entryTime = dailySnap.data().entry_time;
            const calculations = calculateDailyAttendance(entryTime, timestampIso);

            await dailyRef.update({
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

        res.status(201).json({ id: dailyRecordId, type, timestamp: timestampIso });
    })
);

// GET /api/attendance — List attendance (filtered)
router.get(
    '/',
    verifyToken,
    asyncHandler(async (req, res) => {
        const isPrivileged = req.user.role === 'admin' || req.user.role === 'hr';
        let { userId, startDate, endDate } = req.query;

        let query = db.collection('attendance');

        if (!isPrivileged) {
            query = query.where('userId', '==', req.user.uid);
        } else if (userId) {
            query = query.where('userId', '==', userId);
        }

        // Firestore does not support multiple range filters on different fields easily,
        // but it supports range filters on the same field "timestamp"
        if (startDate) {
            query = query.where('timestamp', '>=', startDate);
        }
        if (endDate) {
            query = query.where('timestamp', '<=', endDate);
        }

        query = query.orderBy('timestamp', 'desc').limit(100);

        const snapshot = await query.get();

        // Manual join with user & profile
        const attendancePromises = snapshot.docs.map(async (doc) => {
            const att = doc.data();
            const userDoc = await db.collection('users').doc(att.userId).get();
            const profileDoc = await db.collection('profiles').doc(att.userId).get();

            return {
                id: doc.id,
                ...att,
                email: userDoc.exists ? userDoc.data().email : null,
                fullName: profileDoc.exists ? profileDoc.data().fullName : null,
                department: profileDoc.exists ? profileDoc.data().department : null
            };
        });

        const rows = await Promise.all(attendancePromises);
        res.json(rows);
    })
);

// GET /api/attendance/history — User's recent history
router.get(
    '/history',
    verifyToken,
    asyncHandler(async (req, res) => {
        const snapshot = await db.collection('attendance')
            .where('userId', '==', req.user.uid)
            .orderBy('timestamp', 'desc')
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
        const { month_year } = req.query; // formato YYYY-MM
        const isPrivileged = req.user.role === 'admin' || req.user.role === 'jefatura';
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

// GET /api/attendance/admin-summary — Admin: Resumen histórico mensual global (todos los usuarios)
router.get(
    '/admin-summary',
    verifyToken,
    authorize('admin', 'hr'),
    asyncHandler(async (req, res) => {
        const { month_year } = req.query; // formato YYYY-MM

        let query = db.collection('daily_attendance');

        if (month_year) {
            query = query.where('date', '>=', `${month_year}-01`)
                .where('date', '<=', `${month_year}-31`);
        }

        query = query.orderBy('date', 'desc').limit(100);
        const snapshot = await query.get();

        const promises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.user_id).get();
            return {
                id: doc.id,
                ...data,
                user_email: userDoc.exists ? userDoc.data().email : 'Unknown',
                user_name: userDoc.exists ? userDoc.data().name : 'Unknown'
            };
        });

        const rows = await Promise.all(promises);
        res.json(rows);
    })
);

// POST /api/attendance/manual — HR/Admin: Excepción / Edición Justificada (No marcaje involuntario)
router.post(
    '/manual',
    verifyToken,
    authorize('admin', 'hr'),
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
    authorize('admin', 'hr'),
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
