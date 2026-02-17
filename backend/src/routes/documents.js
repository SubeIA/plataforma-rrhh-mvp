import { Router } from 'express';
import db from '../db.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import { AppError, NotFoundError } from '../errors/AppError.js';

const router = Router();

// POST /api/documents/upload — HR/Admin: upload document
router.post(
    '/upload',
    verifyToken,
    authorize('admin', 'hr'),
    asyncHandler(async (req, res) => {
        const { userId, name, url } = req.body;
        const result = await db.run(
            'INSERT INTO documents (userId, name, url) VALUES (?, ?, ?)',
            [userId, name, url]
        );
        res.status(201).json({ id: result.id, message: 'Document uploaded successfully' });
    })
);

// GET /api/documents/my-documents — Employee: own documents
router.get(
    '/my-documents',
    verifyToken,
    asyncHandler(async (req, res) => {
        const rows = await db.query(
            'SELECT * FROM documents WHERE userId = ? ORDER BY createdAt DESC',
            [req.user.id]
        );
        res.json(rows);
    })
);

// POST /api/documents/:id/sign — Employee: sign document
router.post(
    '/:id/sign',
    verifyToken,
    asyncHandler(async (req, res) => {
        const doc = await db.get(
            'SELECT * FROM documents WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        if (!doc) {
            throw new NotFoundError('Document');
        }
        if (doc.status === 'SIGNED') {
            throw new AppError('Document already signed', 400);
        }

        const signedAt = new Date().toISOString();
        await db.run(
            "UPDATE documents SET status = 'SIGNED', signedAt = ? WHERE id = ?",
            [signedAt, req.params.id]
        );
        res.json({ message: 'Document signed successfully', signedAt });
    })
);

export default router;
