import { Router } from 'express';
import db from '../db.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import { getHoursDifference } from '../utils/geo.js';

const router = Router();

// GET /api/reports/payroll — HR/Admin: generate payroll report
router.get(
    '/payroll',
    verifyToken,
    authorize('admin', 'hr'),
    asyncHandler(async (req, res) => {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: true, message: 'startDate and endDate are required' });
        }

        const queryStartDate = startDate + 'T00:00:00';
        const queryEndDate = endDate + 'T23:59:59';

        const rows = await db.query(
            `SELECT u.id, u.email, p.fullName, p.department, 
                    a.type, a.timestamp
             FROM users u
             LEFT JOIN profiles p ON u.id = p.userId
             LEFT JOIN attendance a ON u.id = a.userId
             WHERE a.timestamp BETWEEN ? AND ?
             ORDER BY u.id, a.timestamp ASC`,
            [queryStartDate, queryEndDate]
        );

        // Process rows to calculate hours per user
        const report = {};

        rows.forEach((row) => {
            if (!report[row.id]) {
                report[row.id] = {
                    id: row.id,
                    email: row.email,
                    fullName: row.fullName || 'N/A',
                    department: row.department || 'N/A',
                    totalHours: 0,
                    daysWorked: 0,
                    records: [],
                };
            }
            report[row.id].records.push(row);
        });

        // Calculate hours per user
        Object.values(report).forEach((user) => {
            let currentIn = null;
            const days = new Set();

            user.records.forEach((record) => {
                const time = new Date(record.timestamp);
                days.add(time.toDateString());

                if (record.type === 'IN') {
                    currentIn = time;
                } else if (record.type === 'OUT' && currentIn) {
                    user.totalHours += getHoursDifference(currentIn, time);
                    currentIn = null;
                }
            });

            user.daysWorked = days.size;
            delete user.records;
            user.totalHours = parseFloat(user.totalHours.toFixed(2));
        });

        res.json(Object.values(report));
    })
);

export default router;
