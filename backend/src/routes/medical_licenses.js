import express from 'express';
const router = express.Router();
import { db } from '../config/firebase-config.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { createMedicalLicenseSchema, updateMedicalLicenseStatusSchema } from '../validators/medical_licenses.js';
import { ROLES, PRIVILEGED_ROLES } from '../constants/roles.js';

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
router.get('/', verifyToken, asyncHandler(async (req, res) => {
    const { role, uid, companyId } = req.user;
    let queryRef = db.collection('medical_licenses')
        .where('companyId', '==', companyId);

    if (!PRIVILEGED_ROLES.includes(role)) {
        queryRef = queryRef.where('userId', '==', uid);
    }

    const snapshot = await queryRef.orderBy('createdAt', 'desc').get();
    const licenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json(licenses);
}));

/**
 * POST /api/medical-licenses
 * Endpoint principal para Recepcionar una licencia electrónica.
 * Solo Admin/HR pueden subir licencias (simula integración con IMED).
 */
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
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
    await db.collection('audit_log').add({
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
}));

/**
 * PUT /api/medical-licenses/:folio/status
 * Permite cambiar el estado (ej. de RECEPCIONADA a TRAMITADA)
 * Solo Admin/HR.
 */
router.put('/:folio/status', verifyToken, authorize(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
    const { folio } = req.params;
    const { status } = updateMedicalLicenseStatusSchema.parse(req.body);

    const docRef = db.collection('medical_licenses').doc(folio);
    const docSnap = await docRef.get();

    if (!docSnap.exists || docSnap.data().companyId !== req.user.companyId) {
        return res.status(404).json({ error: 'Licencia médica no encontrada' });
    }

    const data = docSnap.data();

    // Validar transiciones de estado válidas
    const validTransitions = {
        'RECEPCIONADA': ['TRAMITADA'],
        'TRAMITADA': [] // Estado final
    };
    const allowedNextStates = validTransitions[data.status] || [];
    if (!allowedNextStates.includes(status)) {
        return res.status(400).json({ error: `No se puede cambiar de ${data.status} a ${status}` });
    }

    await docRef.update({
        status,
        updatedAt: new Date(),
        updatedBy: req.user.uid
    });

    // Auditoría
    await db.collection('audit_log').add({
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
}));

export default router;
