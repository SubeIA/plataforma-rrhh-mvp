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
        const { type, startDate, endDate, returnDate, timeFormat, reason } = req.body;

        const profileDoc = await db.collection('profiles').doc(req.user.uid).get();
        let userName = "Empleado Desconocido";
        if (profileDoc.exists) {
            userName = profileDoc.data().fullName || userName;
        }

        const newDoc = await db.collection('requests').add({
            userId: req.user.uid,
            userName,
            type,
            startDate,
            endDate,
            returnDate,
            timeFormat,
            reason: reason || "",
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
        const role = req.user.role; // Extract the requested role from token middleware
        const isPrivileged = role === 'Admin' || role === 'Jefatura';
        const { mode, status } = req.query;

        let query = db.collection('requests');

        if (!isPrivileged || mode === 'my-requests') {
            query = query.where('userId', '==', req.user.uid);
        }

        if (isPrivileged && status) {
            query = query.where('status', '==', status);
        }

        // Add additional logic so Jefatura sees only their department? (Future feature)

        // Cannot easily multiple orderBy if there are unindexed multiple wheres on status and userId
        const snapshot = await query.get();

        const requestsList = snapshot.docs.map((doc) => {
            const reqData = doc.data();
            return {
                id: doc.id,
                ...reqData,
            };
        });

        // Sort descending by created at natively
        requestsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ requests: requestsList });
    })
);

// PUT /api/requests/:id/status — HR/Admin/Jefatura: update request status
router.put(
    '/:id/status',
    verifyToken,
    authorize('Admin', 'Jefatura'),
    validate(updateRequestStatusSchema),
    asyncHandler(async (req, res) => {
        const { status, response } = req.body;
        const role = req.user.role;

        // Validation Rules:
        // Jefatura can only transition PENDING -> VISADO or REJECTED
        // Admin can transition VISADO -> APPROVED or PENDING -> APPROVED or REJECTED

        const requestDoc = await db.collection('requests').doc(req.params.id).get();
        if (!requestDoc.exists) {
            return res.status(404).json({ error: "Solicitud no encontrada" });
        }

        const currentStatus = requestDoc.data().status;

        if (role === 'Jefatura') {
            if (status !== 'VISADO' && status !== 'REJECTED') {
                return res.status(403).json({ error: "Jefatura solo puede VISAR o RECHAZAR" });
            }
            if (currentStatus !== 'PENDING') {
                return res.status(400).json({ error: "Solo puede visar solicitudes PENDIENTES" });
            }
        }

        const updateData = {
            status,
            adminResponse: response || "",
            updatedAt: new Date().toISOString()
        };

        if (status === 'VISADO') {
            updateData.visadoBy = req.user.uid;
        } else if (status === 'APPROVED' || status === 'REJECTED') {
            updateData.approvedBy = req.user.uid;
        }

        await db.collection('requests').doc(req.params.id).update(updateData);

        // Record Audit
        await db.collection('audit_log').add({
            userId: req.user.uid,
            action: `REQUEST_${status}`,
            tableName: 'requests',
            recordId: req.params.id,
            details: JSON.stringify({ oldStatus: currentStatus, newStatus: status, response }),
            timestamp: new Date().toISOString()
        });

        // Descontar saldo si se aprueba
        if (status === 'APPROVED') {
            const reqData = requestDoc.data();
            const { userId, type, timeFormat, startDate, endDate } = reqData;

            // Determinar a qué saldo descontar
            let balanceType = "";
            if (type === "PERMISO_ADMINISTRATIVO") balanceType = "administrative_days";
            else if (type === "FERIADO_LEGAL") balanceType = "legal_holidays";
            else if (type === "COMPENSATORIO") balanceType = "compensatory_hours";

            if (balanceType) {
                // Estimar la cantidad a descontar
                // Para este MVP, asumenos 1 dia a descontar por defecto, o medio por AM/PM
                // Si compensatorio, asumimos 8 horas por dia completo.
                let amountToDeduct = 0;
                if (timeFormat === 'DIA_COMPLETO') {
                    // Calcular dif dias entre startDate y endDate
                    const start = new Date(startDate.seconds * 1000);
                    const end = new Date(endDate.seconds * 1000);
                    // Set same time to avoid partial days
                    start.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                    amountToDeduct = balanceType === "compensatory_hours" ? (diffDays * 8) : diffDays;

                } else { // MEDIO_DIA_AM o MEDIO_DIA_PM
                    amountToDeduct = balanceType === "compensatory_hours" ? 4 : 0.5;
                }

                const userRef = db.collection('users').doc(userId);
                const uDoc = await userRef.get();

                if (uDoc.exists) {
                    const currentBalances = uDoc.data().balances || {
                        administrative_days: 0,
                        compensatory_hours: 0,
                        legal_holidays: 0
                    };

                    currentBalances[balanceType] -= amountToDeduct;

                    await userRef.update({ balances: currentBalances });
                }
            }
        }

        // Crear una notificación para el usuario final
        const reqData = requestDoc.data();
        let notifMessage = "";
        let notifTitle = "";

        if (status === "VISADO") {
            notifTitle = "Solicitud Visada";
            notifMessage = `Tu solicitud de ${reqData.type.replace(/_/g, " ")} ha sido visada por tu jefatura.`;
        } else if (status === "APPROVED") {
            notifTitle = "Solicitud Aprobada";
            notifMessage = `Tu solicitud de ${reqData.type.replace(/_/g, " ")} ha sido aprobada por la administración.`;
        } else if (status === "REJECTED") {
            notifTitle = "Solicitud Rechazada";
            notifMessage = `Tu solicitud de ${reqData.type.replace(/_/g, " ")} ha sido rechazada.`;
            if (response) {
                notifMessage += ` Motivo: ${response}`;
            }
        }

        if (notifMessage !== "") {
            await db.collection("notifications").add({
                userId: reqData.userId,
                title: notifTitle,
                message: notifMessage,
                type: "REQUEST_STATUS",
                read: false,
                createdAt: new Date().toISOString(),
                link: "/dashboard/requests"
            });
        }

        res.json({ message: 'Request status updated successfully' });
    })
);

export default router;
