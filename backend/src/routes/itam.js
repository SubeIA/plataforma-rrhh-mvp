import express from 'express';
import { db as firestore } from '../config/firebase-config.js';
import { verifyToken as requireAuth, requirePermission } from '../middleware/auth.js';
import asyncHandler from 'express-async-handler';
import { itamAssetSchema } from '../validators/itam.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

// @route   POST /api/itam
// @desc    Assign an IT asset to a user
// @access  Admin, HR
router.post(
    '/',
    requireAuth,
    requirePermission(PERMISSIONS.MANAGE_ITAM),
    asyncHandler(async (req, res) => {
        const payload = req.body;

        const validation = itamAssetSchema.safeParse(payload);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }

        const { user_id, asset_type, serial_id, model, status } = validation.data;
        const companyId = req.user.companyId;

        // Verificar que el usuario objetivo pertenece a la misma empresa
        const userRef = firestore.collection('users').doc(user_id);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Colaborador no encontrado.' });
        }
        if (userDoc.data().companyId !== companyId) {
            return res.status(403).json({ error: 'El colaborador no pertenece a tu empresa.' });
        }

        const newAsset = {
            user_id,
            asset_type,
            serial_id,
            model,
            status: status || 'Asignado',
            companyId,
            assigned_at: new Date().toISOString(),
            assigned_by: req.user.uid
        };

        const docRef = await firestore.collection('itam_assets').add(newAsset);

        res.status(201).json({
            message: 'Activo asignado exitosamente',
            id: docRef.id,
            ...newAsset
        });
    })
);

// @route   GET /api/itam
// @desc    Get all assets of current company, optionally filtered by user_id
// @access  Admin, HR
router.get(
    '/',
    requireAuth,
    requirePermission(PERMISSIONS.MANAGE_ITAM),
    asyncHandler(async (req, res) => {
        const { user_id } = req.query;
        const companyId = req.user.companyId;

        let query = firestore.collection('itam_assets')
            .where('companyId', '==', companyId);

        if (user_id) {
            query = query.where('user_id', '==', user_id);
        }

        query = query.orderBy('assigned_at', 'desc');

        const snapshot = await query.get();
        const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json(assets);
    })
);

// @route   PUT /api/itam/:id/status
// @desc    Update asset status
// @access  Admin, HR
router.put(
    '/:id/status',
    requireAuth,
    requirePermission(PERMISSIONS.MANAGE_ITAM),
    asyncHandler(async (req, res) => {
        const { status } = req.body;
        const { id } = req.params;
        const companyId = req.user.companyId;

        if (!['Asignado', 'Devuelto'].includes(status)) {
            return res.status(400).json({ error: 'Estado de activo no válido.' });
        }

        // Verificar que el activo pertenece a esta empresa
        const assetDoc = await firestore.collection('itam_assets').doc(id).get();
        if (!assetDoc.exists || assetDoc.data().companyId !== companyId) {
            return res.status(404).json({ error: 'Activo no encontrado.' });
        }

        await firestore.collection('itam_assets').doc(id).update({
            status,
            updated_at: new Date().toISOString()
        });

        res.json({ message: 'Estado del activo actualizado.' });
    })
);

// @route   GET /api/itam/me
// @desc    Get logged in user's assets
// @access  Any authenticated user
router.get(
    '/me',
    requireAuth,
    asyncHandler(async (req, res) => {
        const snapshot = await firestore.collection('itam_assets')
            .where('companyId', '==', req.user.companyId)
            .where('user_id', '==', req.user.uid)
            .get();

        const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(assets);
    })
);

export default router;
