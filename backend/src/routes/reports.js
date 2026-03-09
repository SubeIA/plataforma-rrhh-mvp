import { Router } from 'express';
import { db } from '../config/firebase-config.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { verifyToken, authorize } from '../middleware/auth.js';
import { getHoursDifference } from '../utils/geo.js';
import { ROLES, PRIVILEGED_ROLES } from '../constants/roles.js';

const router = Router();

// GET /api/reports/payroll — HR/Admin: generate payroll report
router.get(
    '/payroll',
    verifyToken,
    authorize(ROLES.ADMIN, ROLES.HR),
    asyncHandler(async (req, res) => {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: true, message: 'startDate and endDate are required' });
        }

        // 1. Obtener todos los usuarios con sus perfiles
        const usersSnapshot = await db.collection('users').get();
        const userIds = usersSnapshot.docs.map(d => d.id);

        // Batch read de perfiles
        const profileRefs = userIds.map(uid => db.collection('profiles').doc(uid));
        const profileDocs = profileRefs.length > 0 ? await db.getAll(...profileRefs) : [];

        const profileMap = {};
        profileDocs.forEach(doc => {
            if (doc.exists) {
                profileMap[doc.id] = doc.data();
            }
        });

        // 2. Obtener registros de asistencia diaria en el rango de fechas
        let query = db.collection('daily_attendance')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .orderBy('date', 'asc');

        const attendanceSnapshot = await query.get();

        // 3. Construir reporte por usuario
        const report = {};

        usersSnapshot.docs.forEach(userDoc => {
            const userData = userDoc.data();
            const profile = profileMap[userDoc.id] || {};
            report[userDoc.id] = {
                id: userDoc.id,
                email: userData.email,
                fullName: profile.fullName || 'N/A',
                department: profile.department || 'N/A',
                totalHours: 0,
                daysWorked: 0,
                totalLateMinutes: 0,
                totalExtraMinutes: 0,
            };
        });

        attendanceSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const userId = data.user_id;

            if (!report[userId]) return;

            if (data.entry_time && data.exit_time) {
                const hours = data.calculated_work_hours || 0;
                report[userId].totalHours += hours;
                report[userId].daysWorked += 1;
                report[userId].totalLateMinutes += data.late_minutes || 0;
                report[userId].totalExtraMinutes += data.extra_minutes || 0;
            }
        });

        // 4. Formatear resultado
        const result = Object.values(report)
            .filter(user => user.daysWorked > 0)
            .map(user => ({
                ...user,
                totalHours: parseFloat(user.totalHours.toFixed(2)),
            }));

        res.json(result);
    })
);

export default router;
