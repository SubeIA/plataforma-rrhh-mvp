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
import { getDistanceInMeters } from '../utils/geo.js';
import { AppError } from '../errors/AppError.js';

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

        const officesSnapshot = await db.collection('offices').get();
        const offices = officesSnapshot.docs.map(doc => doc.data());

        if (offices.length > 0) {
            let withinRange = false;
            for (const office of offices) {
                const distance = getDistanceInMeters(lat, lng, office.lat, office.lng);
                if (distance <= (office.radius || 100)) {
                    withinRange = true;
                    break;
                }
            }
            if (!withinRange) {
                throw new AppError('No estás dentro del rango permitido de la oficina. No se puede registrar asistencia.', 403);
            }
        }

        const newDoc = await db.collection('attendance').add({
            userId,
            type,
            lat,
            lng,
            accuracy: accuracy || null,
            timestamp: new Date().toISOString()
        });

        res.status(201).json({ id: newDoc.id, type, timestamp: new Date() });
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

// GET /api/attendance/all — Admin: all attendance (legacy endpoint)
router.get(
    '/all',
    verifyToken,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const snapshot = await db.collection('attendance')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();

        const promises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.userId).get();
            return {
                id: doc.id,
                ...data,
                email: userDoc.exists ? userDoc.data().email : 'Unknown'
            };
        });

        const rows = await Promise.all(promises);
        res.json(rows);
    })
);

// POST /api/attendance/manual — HR/Admin: manual entry
router.post(
    '/manual',
    verifyToken,
    authorize('admin', 'hr'),
    validate(manualAttendanceSchema),
    asyncHandler(async (req, res) => {
        const { userId, type, timestamp } = req.body;

        const newDoc = await db.collection('attendance').add({
            userId,
            type,
            timestamp
        });

        await db.collection('audit_log').add({
            userId: req.user.uid,
            action: 'MANUAL_ENTRY',
            tableName: 'attendance',
            recordId: newDoc.id,
            details: JSON.stringify({ targetUserId: userId, type, timestamp }),
            timestamp: new Date().toISOString()
        });

        res.status(201).json({ id: newDoc.id, message: 'Record added manually' });
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
