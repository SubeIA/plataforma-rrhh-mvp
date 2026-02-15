
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let adminToken = '';
let userId = '';
let shiftId = '';

async function runVerification() {
    try {
        console.log('--- STARTING PHASE 5 VERIFICATION ---');

        // 1. Login as Admin
        console.log('\n1. Logging in as Admin...');
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@test.com',
            password: 'admin'
        });
        adminToken = adminLogin.data.token;
        console.log('✅ Admin logged in.');

        // 2. Create User
        console.log('\n2. Creating Test User for Shift...');
        const email = `shift_user_${Date.now()}@test.com`;
        const createRes = await axios.post(`${BASE_URL}/users`, {
            email, password: 'password123', role: 'user',
            fullName: 'Shift Tester', phone: '111', address: 'Address',
            department: 'Ops', position: 'Worker', startDate: '2024-01-01'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        userId = createRes.data.id;
        console.log(`✅ User created: ${userId}`);

        // 3. Create Shift
        console.log('\n3. Creating Shift...');
        const shiftRes = await axios.post(`${BASE_URL}/shifts`, {
            name: 'Morning Shift',
            startTime: '08:00',
            endTime: '17:00',
            toleranceMinutes: 10
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        shiftId = shiftRes.data.id;
        console.log(`✅ Shift created. ID: ${shiftId}`);

        // 4. Assign Shift
        console.log('\n4. Assigning Shift to User...');
        await axios.post(`${BASE_URL}/shifts/assign`, {
            userId,
            shiftId,
            startDate: '2024-01-01'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('✅ Shift assigned.');

        // 5. Verify Assignment
        console.log('\n5. Verifying Assignment...');
        const userLogin = await axios.post(`${BASE_URL}/auth/login`, { email, password: 'password123' });
        const userToken = userLogin.data.token;

        const myShift = await axios.get(`${BASE_URL}/users/${userId}/shift`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        if (myShift.data && myShift.data.name === 'Morning Shift') {
            console.log(`✅ User has correct shift: ${myShift.data.name} (${myShift.data.startTime}-${myShift.data.endTime})`);
        } else {
            throw new Error('Shift assignment verification failed');
        }

        console.log('\n--- PHASE 5 VERIFICATION SUCCESSFUL ---');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error.response ? error.response.data : error.message);
    }
}

runVerification();
