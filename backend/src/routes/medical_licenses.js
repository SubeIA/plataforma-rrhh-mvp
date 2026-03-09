import express from 'express';
const router = express.Router();
import { db } from '../config/firebase-config.js';
import { verifyToken as authMiddleware, authorize as roleMiddleware } from '../middleware/auth.js';
import { createMedicalLicenseSchema, updateMedicalLicenseStatusSchema } from '../validators/medical_licenses.js';

// Helper para parsear la fecha
function parseStartDate(startDate) {
    if (typeof startDate === 'string') {
        return new Date(startDate);
    } else if (startDate && (startDate._seconds || startDate.seconds)) {
        const secs = startDate._seconds || startDate.seconds;
        return new Date(secs * 1000);
    }
    return new Date();
}

/**
 * GET /api/medical-licenses
 * - Admin/HR puede ver todas
 * - Usuario solo puede ver las suyas
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { role, uid, companyId } = req.user;
        let queryRef = db.collection('medical_licenses')
            .where('companyId', '==', companyId);

        if (role !== 'admin' && role !== 'hr' && role !== 'super_admin') {
            queryRef = queryRef.where('userId', '==', uid);
        }

        const snapshot = await queryRef.orderBy('createdAt', 'desc').get();
        const licenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json(licenses);
    } catch (error) {
        console.error('Error fetching medical licenses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/medical-licenses
 * Endpoint principal para Recepcionar una licencia electrónica. 
 * Solo Admin/HR pueden subir licencias (simula integración con IMED).
 */
router.post('/', authMiddleware, roleMiddleware(['admin', 'hr']), async (req, res) => {
    try {
        const validatedData = createMedicalLicenseSchema.parse(req.body);

        // Usar el folio como Document ID
        const docRef = db.collection('medical_licenses').doc(validatedData.folio);

        const docExists = await docRef.get();
        if (docExists.exists) {
            return res.status(400).json({ error: 'Ya existe una licencia con ese folio' });
        }

        const newLicense = {
            userId: validatedData.userId,
            folio: validatedData.folio,
            startDate: parseStartDate(validatedData.startDate),
            durationDays: validatedData.durationDays,
            status: "RECEPCIONADA",
            companyId: req.user.companyId,
            createdAt: new Date(),
            createdBy: req.user.uid
        };

        await docRef.set(newLicense);

        // Auditoría
        await db.collection('audit_logs').add({
            action: 'CREATE_MEDICAL_LICENSE',
            performedBy: req.user.uid,
            licenseFolio: validatedData.folio,
            userId: validatedData.userId,
            timestamp: new Date()
        });

        // Crear una notificación para el usuario final reportando su nueva licencia
        await db.collection("notifications").add({
            userId: validatedData.userId,
            title: "Licencia Médica Recepcionada",
            message: `Folio: ${validatedData.folio} ha sido recepcionada exitosamente.`,
            type: "MEDICAL_LICENSE",
            read: false,
            createdAt: new Date().toISOString()
        });

        res.status(201).json({
            id: validatedData.folio,
            message: 'Licencia recepcionada correctamente',
            ...newLicense
        });

    } catch (error) {
        console.error('Error creating medical license:', error);
        if (error.name === 'ZodError') {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/medical-licenses/:folio/status
 * Permite cambiar el estado (ej. de RECEPCIONADA a TRAMITADA)
 * Solo Admin/HR.
 */
router.put('/:folio/status', authMiddleware, roleMiddleware(['admin', 'hr']), async (req, res) => {
    try {
        const { folio } = req.params;
        const { status } = updateMedicalLicenseStatusSchema.parse(req.body);

        const docRef = db.collection('medical_licenses').doc(folio);
        const docSnap = await docRef.get();

        if (!docSnap.exists || docSnap.data().companyId !== req.user.companyId) {
            return res.status(404).json({ error: 'Licencia médica no encontrada' });
        }

        const data = docSnap.data();

        await docRef.update({
            status,
            updatedAt: new Date(),
            updatedBy: req.user.uid
        });

        // Auditoría
        await db.collection('audit_logs').add({
            action: 'UPDATE_MEDICAL_LICENSE_STATUS',
            performedBy: req.user.uid,
            licenseFolio: folio,
            oldStatus: data.status,
            newStatus: status,
            timestamp: new Date()
        });

        // Notificación al usuario si el estado es TRAMITADA
        if (status === "TRAMITADA") {
            await db.collection("notifications").add({
                userId: data.userId,
                title: "Licencia Médica Tramitada",
                message: `Tu licencia folio ${folio} ha sido enviada a tramitación.`,
                type: "MEDICAL_LICENSE",
                read: false,
                createdAt: new Date().toISOString()
            });
        }

        res.json({ message: `Licencia ${folio} actualizada a ${status}` });

    } catch (error) {
        console.error('Error updating medical license:', error);
        if (error.name === 'ZodError') {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
