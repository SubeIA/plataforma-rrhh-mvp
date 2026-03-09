import express from 'express';
import { db as firestore } from '../config/firebase-config.js';
import { verifyToken as requireAuth, authorize as requireRoles } from '../middleware/auth.js';
import asyncHandler from 'express-async-handler';
import { getStartOfCurrentMonth, getEndOfCurrentMonth, getStartOfPreviousMonth, getEndOfPreviousMonth } from '../utils/dates.js';
import { PRIVILEGED_ROLES } from '../constants/roles.js';
const router = express.Router();

// Get start and end of current month
const getMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

// @route   GET /api/analytics/kpis
// @desc    Get Key Performance Indicators for HR Dashboard
// @access  Admin, Jefatura
router.get(
    '/kpis',
    requireAuth,
    requireRoles(PRIVILEGED_ROLES),
    asyncHandler(async (req, res) => {
        try {
            const { start: monthStart, end: monthEnd } = getMonthRange();

            // 1. Total Active Users
            const usersSnapshot = await firestore.collection('users').get();
            const totalUsers = usersSnapshot.size; // Assuming all users are active if there's no status field

            // 2. Absenteeism (Approved requests taking full days)
            // Using a simple logic: count approved Permisos Administrativos and Feriados in this month
            const requestsSnapshot = await firestore.collection('requests')
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
                        // assume 9 hours per day for a Full_Day, or read requested_hours if available
                        compensatoryHoursConsumed += reqData.duration_type === 'Full_Day' ? 9 : 4.5;
                    }
                }
            });

            // Calculate potential work days in month (rough approx: 22 days per user)
            const totalWorkDays = totalUsers * 22;
            const absenteeismRate = totalWorkDays > 0 ? ((absentDays / totalWorkDays) * 100).toFixed(2) : 0;

            // 3. Medical Licenses Frequency
            const licensesSnapshot = await firestore.collection('medical_licenses').get();
            let currentMonthLicenses = 0;
            licensesSnapshot.forEach(doc => {
                const data = doc.data();
                const startDate = data.start_date?.toDate();
                if (startDate >= monthStart && startDate <= monthEnd) {
                    currentMonthLicenses++;
                }
            });

            // 4. Lateness Frequency (Atrasos)
            const attendanceSnapshot = await firestore.collection('attendances').get();
            let totalLates = 0;
            attendanceSnapshot.forEach(doc => {
                const data = doc.data();
                const date = data.date ? new Date(data.date) : data.entry_time?.toDate();
                if (date && date >= monthStart && date <= monthEnd) {
                    if (data.late_minutes && data.late_minutes > 0) {
                        totalLates++;
                    }
                }
            });

            // 5. Turnover (Rotación) - Needs historical activation/deactivation data. 
            // For now, returning a static or naive calculated value.
            const turnoverRate = 0; // Replace with actual logic if we had tracking of join/leave dates.

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
            res.status(500).json({ error: 'Error calculating KPIs' });
        }
    })
);

export default router;
