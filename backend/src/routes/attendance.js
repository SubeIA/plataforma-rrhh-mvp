import { Router } from 'express';
import db from '../db.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
    punchSchema,
    manualAttendanceSchema,
    updateAttendanceSchema,
} from '../validators/attendance.js';
import { getDistanceInMeters } from '../utils/geo.js';

const router = Router();

// POST /api/attendance — Punch IN/OUT
router.post(
    '/',
    verifyToken,
    validate(punchSchema),
    asyncHandler(async (req, res) => {
        const { type, lat, lng, accuracy } = req.body;
        const userId = req.user.id;

        // Geolocation Validation
        if (lat != null && lng != null) {
            const offices = await db.query('SELECT * FROM offices');

            if (offices.length > 0) {
                let withinRange = false;
                for (const office of offices) {
                    const distance = getDistanceInMeters(lat, lng, office.lat, office.lng);
                    if (distance <= office.radius) {
                        withinRange = true;
                        break;
                    }
                }
                if (!withinRange) {
                    console.warn(`User ${userId} punched outside range. Coords: ${lat},${lng}`);
                }
            }
        }

        const result = await db.run(
            'INSERT INTO attendance (userId, type, lat, lng, accuracy) VALUES (?, ?, ?, ?, ?)',
            [userId, type, lat || null, lng || null, accuracy || null]
        );
        res.status(201).json({ id: result.id, type, timestamp: new Date() });
    })
);

// GET /api/attendance — List attendance (filtered)
router.get(
    '/',
    verifyToken,
    asyncHandler(async (req, res) => {
        const isPrivileged = req.user.role === 'admin' || req.user.role === 'hr';
        const { userId, startDate, endDate } = req.query;

        let sql = `
            SELECT a.id, a.type, a.timestamp, u.email, p.fullName, p.department 
            FROM attendance a 
            JOIN users u ON a.userId = u.id 
            LEFT JOIN profiles p ON u.id = p.userId
            WHERE 1=1
        `;
        const params = [];

        if (!isPrivileged) {
            sql += ' AND a.userId = ?';
            params.push(req.user.id);
        } else if (userId) {
            sql += ' AND a.userId = ?';
            params.push(userId);
        }

        if (startDate) {
            sql += ' AND a.timestamp >= ?';
            params.push(startDate);
        }
        if (endDate) {
            sql += ' AND a.timestamp <= ?';
            params.push(endDate);
        }

        sql += ' ORDER BY a.timestamp DESC LIMIT 100';

        const rows = await db.query(sql, params);
        res.json(rows);
    })
);

// GET /api/attendance/history — User's recent history
router.get(
    '/history',
    verifyToken,
    asyncHandler(async (req, res) => {
        const rows = await db.query(
            'SELECT * FROM attendance WHERE userId = ? ORDER BY timestamp DESC LIMIT 10',
            [req.user.id]
        );
        res.json(rows);
    })
);

// GET /api/attendance/all — Admin: all attendance (legacy endpoint)
router.get(
    '/all',
    verifyToken,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const rows = await db.query(`
            SELECT a.id, a.type, a.timestamp, u.email 
            FROM attendance a 
            JOIN users u ON a.userId = u.id 
            ORDER BY a.timestamp DESC 
            LIMIT 50
        `);
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
        const result = await db.run(
            'INSERT INTO attendance (userId, type, timestamp) VALUES (?, ?, ?)',
            [userId, type, timestamp]
        );
        res.status(201).json({ id: result.id, message: 'Record added manually' });
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
        await db.run(
            'UPDATE attendance SET type = ?, timestamp = ? WHERE id = ?',
            [type, timestamp, id]
        );
        res.json({ message: 'Record updated successfully' });
    })
);

export default router;
