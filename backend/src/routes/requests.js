import { Router } from 'express';
import db from '../db.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createRequestSchema, updateRequestStatusSchema } from '../validators/requests.js';

const router = Router();

// POST /api/requests — Employee: submit a request
router.post(
    '/',
    verifyToken,
    validate(createRequestSchema),
    asyncHandler(async (req, res) => {
        const { type, startDate, endDate, reason } = req.body;
        const result = await db.run(
            'INSERT INTO requests (userId, type, startDate, endDate, reason) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, type, startDate, endDate, reason]
        );
        res.status(201).json({ id: result.id, message: 'Request submitted successfully' });
    })
);

// GET /api/requests — List requests (all for HR/Admin, own for user)
router.get(
    '/',
    verifyToken,
    asyncHandler(async (req, res) => {
        const isPrivileged = req.user.role === 'admin' || req.user.role === 'hr';
        const { mode } = req.query;

        let sql = `
            SELECT r.*, u.email, p.fullName, p.department
            FROM requests r
            JOIN users u ON r.userId = u.id
            LEFT JOIN profiles p ON u.id = p.userId
        `;
        const params = [];

        if (!isPrivileged || mode === 'my-requests') {
            sql += ' WHERE r.userId = ?';
            params.push(req.user.id);
        }

        sql += ' ORDER BY r.createdAt DESC';

        const rows = await db.query(sql, params);
        res.json(rows);
    })
);

// PUT /api/requests/:id/status — HR/Admin: update request status
router.put(
    '/:id/status',
    verifyToken,
    authorize('admin', 'hr'),
    validate(updateRequestStatusSchema),
    asyncHandler(async (req, res) => {
        const { status, response } = req.body;
        await db.run(
            'UPDATE requests SET status = ?, response = ? WHERE id = ?',
            [status, response, req.params.id]
        );
        await db.audit(req.user.id, 'STATUS_CHANGE', 'requests', req.params.id, { status, response });
        res.json({ message: 'Request updated successfully' });
    })
);

export default router;
