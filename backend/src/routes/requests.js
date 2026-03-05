import { Router } from 'express';
import { db } from '../config/firebase-config.js';
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

        const newDoc = await db.collection('requests').add({
            userId: req.user.uid,
            type,
            startDate,
            endDate,
            reason,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ id: newDoc.id, message: 'Request submitted successfully' });
    })
);

// GET /api/requests — List requests (all for HR/Admin, own for user)
router.get(
    '/',
    verifyToken,
    asyncHandler(async (req, res) => {
        const isPrivileged = req.user.role === 'admin' || req.user.role === 'hr';
        const { mode } = req.query;

        let query = db.collection('requests');

        if (!isPrivileged || mode === 'my-requests') {
            query = query.where('userId', '==', req.user.uid);
        }

        query = query.orderBy('createdAt', 'desc').limit(50);

        const snapshot = await query.get();

        const requestsPromises = snapshot.docs.map(async (doc) => {
            const reqData = doc.data();
            const userDoc = await db.collection('users').doc(reqData.userId).get();
            const profileDoc = await db.collection('profiles').doc(reqData.userId).get();

            return {
                id: doc.id,
                ...reqData,
                email: userDoc.exists ? userDoc.data().email : 'Unknown',
                fullName: profileDoc.exists ? profileDoc.data().fullName : 'Unknown',
                department: profileDoc.exists ? profileDoc.data().department : 'Unknown'
            };
        });

        const rows = await Promise.all(requestsPromises);
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

        await db.collection('requests').doc(req.params.id).update({
            status,
            response
        });

        await db.collection('audit_log').add({
            userId: req.user.uid,
            action: 'STATUS_CHANGE',
            tableName: 'requests',
            recordId: req.params.id,
            details: JSON.stringify({ status, response }),
            timestamp: new Date().toISOString()
        });

        res.json({ message: 'Request updated successfully' });
    })
);

export default router;
