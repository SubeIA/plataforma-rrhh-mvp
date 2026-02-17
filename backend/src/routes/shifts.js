import { Router } from 'express';
import db from '../db.js';
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
        const result = await db.run(
            'INSERT INTO shifts (name, startTime, endTime, toleranceMinutes) VALUES (?, ?, ?, ?)',
            [name, startTime, endTime, toleranceMinutes]
        );
        res.status(201).json({ id: result.id, message: 'Shift created successfully' });
    })
);

// GET /api/shifts — Admin/HR: list all shifts
router.get(
    '/',
    verifyToken,
    authorize('admin', 'hr'),
    asyncHandler(async (req, res) => {
        const rows = await db.query('SELECT * FROM shifts');
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
        const result = await db.run(
            'INSERT INTO user_shifts (userId, shiftId, startDate, endDate) VALUES (?, ?, ?, ?)',
            [userId, shiftId, startDate, endDate]
        );
        res.status(201).json({ id: result.id, message: 'Shift assigned successfully' });
    })
);

export default router;
