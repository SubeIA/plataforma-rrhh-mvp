const express = require('express');
const { firestore } = require('../config/firebase-config');
const { requireAuth, requireRoles } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const { createKarinReportSchema } = require('../validators/karin');
const crypto = require('crypto');

const router = express.Router();

// Fallback key, should be in .env in production: 32 bytes hex string
const ENCRYPTION_KEY = process.env.KARIN_SECRET_KEY || '12345678901234567890123456789012'; // 32 chars
const IV_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        console.error('Decryption failed', e);
        return '[Error desencriptando texto]';
    }
}

// @route   POST /api/karin
// @desc    Submit a new Karin Report
// @access  Authenticated user
router.post(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
        const { isAnonymous, accused_name, description, incident_date } = req.body;

        // Validation
        const validation = createKarinReportSchema.safeParse({ isAnonymous, accused_name, description, incident_date });
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }

        // Encrypt description and accused_name
        const encryptedDescription = encrypt(description);
        const encryptedAccused = encrypt(accused_name);

        const newReport = {
            reporter_id: isAnonymous ? null : req.user.uid,
            accused_name: encryptedAccused, // Encrypted to protect identity in DB
            description: encryptedDescription,
            incident_date: new Date(incident_date).toISOString(),
            status: 'Abierto',
            created_at: new Date().toISOString()
        };

        const docRef = await firestore.collection('karin_reports').add(newReport);

        res.status(201).json({
            message: 'Denuncia enviada correctamente.',
            id: docRef.id
        });
    })
);

// @route   GET /api/karin
// @desc    Get all Karin Reports (Decrypted)
// @access  Admin, Jefatura
router.get(
    '/',
    requireAuth,
    requireRoles(['Admin']), // Only Admins should see this highly sensible data
    asyncHandler(async (req, res) => {
        const reportsSnapshot = await firestore.collection('karin_reports')
            .orderBy('created_at', 'desc')
            .get();

        const reports = [];
        reportsSnapshot.forEach(doc => {
            const data = doc.data();
            reports.push({
                id: doc.id,
                ...data,
                // Decrypt sensitive info for Admin visualizer
                accused_name: decrypt(data.accused_name),
                description: decrypt(data.description)
            });
        });

        res.json(reports);
    })
);

// @route   PUT /api/karin/:id/status
// @desc    Update report status
// @access  Admin
router.put(
    '/:id/status',
    requireAuth,
    requireRoles(['Admin']),
    asyncHandler(async (req, res) => {
        const { status } = req.body;
        const { id } = req.params;

        if (!['Abierto', 'En_Investigacion', 'Cerrado'].includes(status)) {
            return res.status(400).json({ error: 'Estado inválido.' });
        }

        await firestore.collection('karin_reports').doc(id).update({
            status,
            updated_at: new Date().toISOString()
        });

        res.json({ message: 'Estado actualizado correctamente' });
    })
);

module.exports = router;
