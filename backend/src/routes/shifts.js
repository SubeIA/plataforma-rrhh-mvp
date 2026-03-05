import { Router } from 'express';
import { db } from '../config/firebase-config.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createShiftSchema, assignShiftSchema } from '../validators/shifts.js';

const router = Router();

// POST /api/shifts — Admin: create shift
router.post(
    '/',
    verifyToken,
    authorize('admin'),
    validate(createShiftSchema),
    asyncHandler(async (req, res) => {
        const { name, startTime, endTime, toleranceMinutes } = req.body;

        const newDoc = await db.collection('shifts').add({
            name,
            startTime,
            endTime,
            toleranceMinutes: toleranceMinutes || 0
        });

        res.status(201).json({ id: newDoc.id, message: 'Shift created successfully' });
    })
);

// GET /api/shifts — Admin/HR: list all shifts
router.get(
    '/',
    verifyToken,
    authorize('admin', 'hr'),
    asyncHandler(async (req, res) => {
        const snapshot = await db.collection('shifts').get();
        const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(rows);
    })
);

// POST /api/shifts/assign — Admin/HR: assign shift to user
router.post(
    '/assign',
    verifyToken,
    authorize('admin', 'hr'),
    validate(assignShiftSchema),
    asyncHandler(async (req, res) => {
        const { userId, shiftId, startDate, endDate } = req.body;

        const newDoc = await db.collection('user_shifts').add({
            userId,
            shiftId,
            startDate,
            endDate: endDate || null
        });

        res.status(201).json({ id: newDoc.id, message: 'Shift assigned successfully' });
    })
);

export default router;
