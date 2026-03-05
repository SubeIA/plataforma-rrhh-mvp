import { Router } from 'express';
import { db } from '../config/firebase-config.js';
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

        const newDoc = await db.collection('documents').add({
            userId,
            name,
            url,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        });

        await db.collection('audit_log').add({
            userId: req.user.uid,
            action: 'UPLOAD',
            tableName: 'documents',
            recordId: newDoc.id,
            details: JSON.stringify({ targetUserId: userId, name }),
            timestamp: new Date().toISOString()
        });

        res.status(201).json({ id: newDoc.id, message: 'Document uploaded successfully' });
    })
);

// GET /api/documents/my-documents — Employee: own documents
router.get(
    '/my-documents',
    verifyToken,
    asyncHandler(async (req, res) => {
        const snapshot = await db.collection('documents')
            .where('userId', '==', req.user.uid)
            .orderBy('createdAt', 'desc')
            .get();

        const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(rows);
    })
);

// POST /api/documents/:id/sign — Employee: sign document
router.post(
    '/:id/sign',
    verifyToken,
    asyncHandler(async (req, res) => {
        const docRef = db.collection('documents').doc(req.params.id);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists || docSnapshot.data().userId !== req.user.uid) {
            throw new NotFoundError('Document');
        }
        if (docSnapshot.data().status === 'SIGNED') {
            throw new AppError('Document already signed', 400);
        }

        const signedAt = new Date().toISOString();
        await docRef.update({
            status: 'SIGNED',
            signedAt
        });

        await db.collection('audit_log').add({
            userId: req.user.uid,
            action: 'SIGN',
            tableName: 'documents',
            recordId: req.params.id,
            details: JSON.stringify({ signedAt }),
            timestamp: new Date().toISOString()
        });

        res.json({ message: 'Document signed successfully', signedAt });
    })
);

export default router;
