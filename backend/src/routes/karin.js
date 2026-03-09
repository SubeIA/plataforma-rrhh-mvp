import express from 'express';
import { db as firestore } from '../config/firebase-config.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { createKarinReportSchema } from '../validators/karin.js';
import crypto from 'crypto';
import { ROLES } from '../constants/roles.js';
import { AppError } from '../errors/AppError.js';

const router = express.Router();

// La clave DEBE estar en .env. En producción, si no existe, el servidor no arranca.
const ENCRYPTION_KEY = process.env.KARIN_SECRET_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error('CRITICAL: KARIN_SECRET_KEY must be set in .env and be exactly 32 characters.');
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}
const IV_LENGTH = 16;

function encrypt(text) {
    if (!ENCRYPTION_KEY) throw new AppError('Encryption key not configured. Set KARIN_SECRET_KEY in .env', 500);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!ENCRYPTION_KEY) throw new AppError('Encryption key not configured. Set KARIN_SECRET_KEY in .env', 500);
    const parts = text.split(':');

    // Soporte retrocompatible: formato viejo CBC (iv:encrypted) vs nuevo GCM (iv:authTag:encrypted)
    if (parts.length === 2) {
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
}

// @route   POST /api/karin
// @desc    Submit a new Karin Report
// @access  Authenticated user
router.post(
    '/',
    verifyToken,
    asyncHandler(async (req, res) => {
        const { isAnonymous, accused_name, description, incident_date } = req.body;

        const validation = createKarinReportSchema.safeParse({ isAnonymous, accused_name, description, incident_date });
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }

        const encryptedDescription = encrypt(description);
        const encryptedAccused = encrypt(accused_name);

        const newReport = {
            reporter_id: isAnonymous ? null : req.user.uid,
            accused_name: encryptedAccused,
            description: encryptedDescription,
            incident_date: new Date(incident_date).toISOString(),
            status: 'Abierto',
            companyId: req.user.companyId,
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
// @access  Admin only
router.get(
    '/',
    verifyToken,
    authorize(ROLES.ADMIN),
    asyncHandler(async (req, res) => {
        const reportsSnapshot = await firestore.collection('karin_reports')
            .where('companyId', '==', req.user.companyId)
            .orderBy('created_at', 'desc')
            .get();

        const reports = reportsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                accused_name: decrypt(data.accused_name),
                description: decrypt(data.description)
            };
        });

        res.json(reports);
    })
);

// @route   PUT /api/karin/:id/status
// @desc    Update report status
// @access  Admin
router.put(
    '/:id/status',
    verifyToken,
    authorize(ROLES.ADMIN),
    asyncHandler(async (req, res) => {
        const { status } = req.body;
        const { id } = req.params;

        if (!['Abierto', 'En_Investigacion', 'Cerrado'].includes(status)) {
            return res.status(400).json({ error: 'Estado inválido.' });
        }

        // Verificar que el reporte pertenece a esta empresa
        const reportDoc = await firestore.collection('karin_reports').doc(id).get();
        if (!reportDoc.exists || reportDoc.data().companyId !== req.user.companyId) {
            return res.status(404).json({ error: 'Reporte no encontrado.' });
        }

        await firestore.collection('karin_reports').doc(id).update({
            status,
            updated_at: new Date().toISOString()
        });

        res.json({ message: 'Estado actualizado correctamente' });
    })
);

export default router;
