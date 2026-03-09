import express from 'express';
import { db as firestore } from '../config/firebase-config.js';
import { verifyToken as requireAuth, authorize as requireRoles } from '../middleware/auth.js';
import asyncHandler from 'express-async-handler';
import { createKarinReportSchema } from '../validators/karin.js';
import crypto from 'crypto';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// La clave DEBE estar en .env en producción. Si no existe, el servidor no debe arrancar silenciosamente con una clave débil.
const ENCRYPTION_KEY = process.env.KARIN_SECRET_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error('CRITICAL: KARIN_SECRET_KEY must be set in .env and be exactly 32 characters.');
}
const IV_LENGTH = 16;
// GCM auth tag is 16 bytes by default

function encrypt(text) {
    if (!ENCRYPTION_KEY) throw new Error('Encryption key not configured');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    try {
        if (!ENCRYPTION_KEY) throw new Error('Encryption key not configured');
        const parts = text.split(':');

        // Soporte retrocompatible: formato viejo CBC (iv:encrypted) vs nuevo GCM (iv:authTag:encrypted)
        if (parts.length === 2) {
            // Formato legacy CBC - solo lectura para datos existentes
            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = Buffer.from(parts[1], 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        }

        // Formato nuevo GCM (iv:authTag:encrypted)
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = Buffer.from(parts.slice(2).join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
        decipher.setAuthTag(authTag);
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
    requireRoles([ROLES.ADMIN]),
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
    requireRoles([ROLES.ADMIN]),
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

export default router;
