import express from 'express';
import { db as firestore } from '../config/firebase-config.js';
import { verifyToken as requireAuth, authorize as requireRoles } from '../middleware/auth.js';
import asyncHandler from 'express-async-handler';
import { PRIVILEGED_ROLES } from '../constants/roles.js';

const router = express.Router();

const getMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

// @route   GET /api/analytics/kpis
// @desc    Get KPIs for HR Dashboard — scoped to the current company
// @access  Admin, HR
router.get(
    '/kpis',
    requireAuth,
    requireRoles(PRIVILEGED_ROLES),
    asyncHandler(async (req, res) => {
        try {
            const { start: monthStart, end: monthEnd } = getMonthRange();
            const companyId = req.user.companyId;

            // 1. Total usuarios activos de la empresa
            const usersSnapshot = await firestore.collection('users')
                .where('companyId', '==', companyId)
                .get();
            const totalUsers = usersSnapshot.size;

            // 2. Ausentismo: solicitudes aprobadas del mes en curso
            const requestsSnapshot = await firestore.collection('requests')
                .where('companyId', '==', companyId)
                .where('status', '==', 'Autorizado_Admin')
                .get();

            let absentDays = 0;
            let compensatoryHoursConsumed = 0;

            requestsSnapshot.forEach(doc => {
                const reqData = doc.data();
                const execDate = reqData.execution_date?.toDate();
                if (execDate >= monthStart && execDate <= monthEnd) {
                    if (reqData.duration_type === 'Full_Day') {
                        absentDays += 1;
                    } else if (['Half_Day_AM', 'Half_Day_PM'].includes(reqData.duration_type)) {
                        absentDays += 0.5;
                    }
                    if (reqData.type === 'Compensatorio') {
                        compensatoryHoursConsumed += reqData.duration_type === 'Full_Day' ? 9 : 4.5;
                    }
                }
            });

            const totalWorkDays = totalUsers * 22;
            const absenteeismRate = totalWorkDays > 0 ? ((absentDays / totalWorkDays) * 100).toFixed(2) : 0;

            // 3. Licencias médicas del mes
            const licensesSnapshot = await firestore.collection('medical_licenses')
                .where('companyId', '==', companyId)
                .get();
            let currentMonthLicenses = 0;
            licensesSnapshot.forEach(doc => {
                const data = doc.data();
                const startDate = data.start_date?.toDate();
                if (startDate >= monthStart && startDate <= monthEnd) {
                    currentMonthLicenses++;
                }
            });

            // 4. Atrasos del mes
            const attendanceSnapshot = await firestore.collection('attendances')
                .where('companyId', '==', companyId)
                .get();
            let totalLates = 0;
            attendanceSnapshot.forEach(doc => {
                const data = doc.data();
                const date = data.date ? new Date(data.date) : data.entry_time?.toDate();
                if (date && date >= monthStart && date <= monthEnd) {
                    if (data.late_minutes && data.late_minutes > 0) totalLates++;
                }
            });

            const turnoverRate = 0;

            res.json({
                totalUsers,
                absenteeismRate,
                latenessCount: totalLates,
                medicalLicensesCount: currentMonthLicenses,
                compensatoryHoursConsumed,
                turnoverRate
            });
        } catch (error) {
            console.error('Error fetching KPIs:', error);
            res.status(500).json({ error: 'Error al cargar métricas' });
        }
    })
);

export default router;
