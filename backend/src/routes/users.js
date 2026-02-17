import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../validators/users.js';
import { ConflictError } from '../errors/AppError.js';

const router = Router();

// GET /api/users — Admin/HR: list all users with profiles
router.get(
    '/',
    verifyToken,
    authorize('admin', 'hr'),
    asyncHandler(async (req, res) => {
        const rows = await db.query(`
            SELECT u.id, u.email, u.role, 
                   p.fullName, p.phone, p.address, p.department, p.position, p.startDate
            FROM users u
            LEFT JOIN profiles p ON u.id = p.userId
        `);
        res.json(rows);
    })
);

// POST /api/users — Admin: create user & profile
router.post(
    '/',
    verifyToken,
    authorize('admin'),
    validate(createUserSchema),
    asyncHandler(async (req, res) => {
        const { email, password, role, fullName, phone, address, department, position, startDate } = req.body;

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        try {
            const userResult = await db.run(
                'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
                [email, hash, role]
            );
            const userId = userResult.id;

            await db.run(
                `INSERT INTO profiles (userId, fullName, phone, address, department, position, startDate)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, fullName, phone, address, department, position, startDate]
            );

            res.status(201).json({ id: userId, email, role, fullName, department, position });
        } catch (err) {
            throw new ConflictError('Error creating user/profile. Email might exist.');
        }
    })
);

// PUT /api/users/:id — Admin: update user & profile
router.put(
    '/:id',
    verifyToken,
    authorize('admin'),
    validate(updateUserSchema),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { email, role, fullName, phone, address, department, position, startDate } = req.body;

        await db.run('UPDATE users SET email = ?, role = ? WHERE id = ?', [email, role, id]);

        await db.run(
            `INSERT INTO profiles (userId, fullName, phone, address, department, position, startDate)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(userId) DO UPDATE SET
             fullName = excluded.fullName,
             phone = excluded.phone,
             address = excluded.address,
             department = excluded.department,
             position = excluded.position,
             startDate = excluded.startDate`,
            [id, fullName, phone, address, department, position, startDate]
        );

        res.json({ message: 'User updated successfully' });
    })
);

// DELETE /api/users/:id — Admin: delete user
router.delete(
    '/:id',
    verifyToken,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted' });
    })
);

// GET /api/users/:id/shift — Get user's current shift
router.get(
    '/:id/shift',
    verifyToken,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const today = new Date().toISOString().split('T')[0];

        const rows = await db.query(
            `SELECT s.*, us.startDate, us.endDate
             FROM user_shifts us
             JOIN shifts s ON us.shiftId = s.id
             WHERE us.userId = ? 
             AND (us.endDate IS NULL OR us.endDate >= ?)
             ORDER BY us.startDate DESC LIMIT 1`,
            [id, today]
        );
        res.json(rows[0] || null);
    })
);

export default router;
