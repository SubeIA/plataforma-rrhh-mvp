import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import config from '../config/env.js';
import asyncHandler from '../middleware/asyncHandler.js';
import validate from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.js';
import { AppError, ConflictError } from '../errors/AppError.js';

const router = Router();

// POST /api/auth/login
router.post(
    '/login',
    validate(loginSchema),
    asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            throw new AppError('User not found', 400);
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            throw new AppError('Invalid password', 400);
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            config.jwtSecret,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: config.isProduction,
            sameSite: config.isProduction ? 'none' : 'lax',
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        res.json({
            user: { id: user.id, email: user.email, role: user.role },
        });
    })
);

// POST /api/auth/register
router.post(
    '/register',
    validate(registerSchema),
    asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        try {
            const result = await db.run(
                'INSERT INTO users (email, password) VALUES (?, ?)',
                [email, hash]
            );
            res.status(201).json({ id: result.id, email });
        } catch (err) {
            throw new ConflictError('Email already exists');
        }
    })
);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction ? 'none' : 'lax',
    });
    res.json({ message: 'Logged out successfully' });
});

export default router;
