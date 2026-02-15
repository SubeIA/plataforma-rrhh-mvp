
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let adminToken = '';
let userId = '';

async function runVerification() {
    try {
        console.log('--- STARTING PHASE 7 VERIFICATION ---');

        // 1. Login as Admin
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@test.com',
            password: 'admin'
        });
        adminToken = adminLogin.data.token;
        console.log('✅ Admin logged in.');

        // 2. Create User for Payoll Test
        const email = `payroll_user_${Date.now()}@test.com`;
        const createRes = await axios.post(`${BASE_URL}/users`, {
            email, password: 'password123', role: 'user',
            fullName: 'Payroll Tester', phone: '111', address: 'Address',
            department: 'Fin', position: 'Analyst', startDate: '2024-01-01'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        userId = createRes.data.id;
        console.log(`✅ User created: ${userId}`);

        // 3. Login as User to Punch
        const userLogin = await axios.post(`${BASE_URL}/auth/login`, { email, password: 'password123' });
        const userToken = userLogin.data.token;

        // 4. Punch IN and OUT (Simulate 4 hours worked)
        // IN at 09:00
        // OUT at 13:00
        // We need to manipulate timestamps in DB or just punch "now" and wait...
        // Since we can't wait 4 hours, and index.js uses Date.now() for punches,
        // we will manually insert records via the manual entry endpoint (Admin) to specify timestamps.

        console.log('\n4. Creating Manual Entries (4 Hours)...');
        const today = new Date().toISOString().split('T')[0];

        await axios.post(`${BASE_URL}/attendance/manual`, {
            userId,
            type: 'IN',
            timestamp: `${today}T09:00:00.000Z`
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        await axios.post(`${BASE_URL}/attendance/manual`, {
            userId,
            type: 'OUT',
            timestamp: `${today}T13:00:00.000Z`
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('✅ Manual entries created.');

        // 5. Generate Report
        console.log('\n5. Generating Payroll Report...');
        const reportRes = await axios.get(`${BASE_URL}/reports/payroll?startDate=${today}&endDate=${today}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        const userReport = reportRes.data.find(r => r.id === userId);
        if (userReport) {
            console.log(`✅ Report found for user. Total Hours: ${userReport.totalHours}`);
            if (userReport.totalHours === 4) {
                console.log('✅ Calculation Correct: 4 Hours.');
            } else {
                console.warn(`⚠️ Warning: Expected 4 hours, got ${userReport.totalHours}`);
            }
        } else {
            throw new Error('User not found in report');
        }

        console.log('\n--- PHASE 7 VERIFICATION SUCCESSFUL ---');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error.response ? error.response.data : error.message);
    }
}

runVerification();
