const express = require('express');
const { firestore } = require('../config/firebase-config');
const { requireAuth, requireRoles } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const { itamAssetSchema } = require('../validators/itam');

const router = express.Router();

// @route   POST /api/itam
// @desc    Assign an IT asset to a user
// @access  Admin, Jefatura
router.post(
    '/',
    requireAuth,
    requireRoles(['Admin', 'Jefatura']),
    asyncHandler(async (req, res) => {
        const payload = req.body;

        // Validate request body
        const validation = itamAssetSchema.safeParse(payload);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }

        const { user_id, asset_type, serial_id, model, status } = validation.data;

        // Verify if user exists
        const userRef = firestore.collection('users').doc(user_id);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Colaborador no encontrado.' });
        }

        const newAsset = {
            user_id,
            asset_type,
            serial_id,
            model,
            status: status || 'Asignado',
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
// @desc    Get all assets optionally filtered by user_id
// @access  Admin, Jefatura
router.get(
    '/',
    requireAuth,
    requireRoles(['Admin', 'Jefatura']),
    asyncHandler(async (req, res) => {
        const { user_id } = req.query;
        let query = firestore.collection('itam_assets').orderBy('assigned_at', 'desc');

        if (user_id) {
            query = firestore.collection('itam_assets').where('user_id', '==', user_id);
        }

        const snapshot = await query.get();
        const assets = [];
        snapshot.forEach(doc => {
            assets.push({ id: doc.id, ...doc.data() });
        });

        res.json(assets);
    })
);

// @route   PUT /api/itam/:id/status
// @desc    Update asset status (e.g., mark as Devuelto)
// @access  Admin, Jefatura
router.put(
    '/:id/status',
    requireAuth,
    requireRoles(['Admin', 'Jefatura']),
    asyncHandler(async (req, res) => {
        const { status } = req.body;
        const { id } = req.params;

        if (!['Asignado', 'Devuelto'].includes(status)) {
            return res.status(400).json({ error: 'Estado de activo no válido.' });
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
            .where('user_id', '==', req.user.uid)
            .get();

        const assets = [];
        snapshot.forEach(doc => {
            assets.push({ id: doc.id, ...doc.data() });
        });

        res.json(assets);
    })
);

module.exports = router;
