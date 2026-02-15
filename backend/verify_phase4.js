
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let adminToken = '';
let employeeToken = '';
let userId = '';
let requestId = '';

async function runVerification() {
    try {
        console.log('--- STARTING PHASE 4 VERIFICATION ---');

        // 1. Login as Admin (to get token)
        console.log('\n1. Logging in as Admin...');
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@test.com',
            password: 'admin'
        });
        adminToken = adminLogin.data.token;
        console.log('✅ Admin logged in.');

        // 2. Create a Test Employee
        console.log('\n2. Creating Test Employee...');
        const email = `emp_p4_${Date.now()}@test.com`;
        try {
            const createRes = await axios.post(`${BASE_URL}/users`, {
                email,
                password: 'password123',
                role: 'user',
                fullName: 'Phase 4 Tester',
                phone: '123456789',
                address: 'Test Address',
                department: 'Testing',
                position: 'Tester',
                startDate: '2024-01-01'
            }, { headers: { Authorization: `Bearer ${adminToken}` } });
            userId = createRes.data.id;
            console.log(`✅ Employee created: ${email} (ID: ${userId})`);
        } catch (e) {
            console.log('⚠️  Employee might already exist, proceeding...');
        }

        // 3. Login as Employee
        console.log('\n3. Logging in as Employee...');
        const empLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email,
            password: 'password123'
        });
        employeeToken = empLogin.data.token;
        console.log('✅ Employee logged in.');

        // 4. Submit a Request (Employee)
        console.log('\n4. Submitting a Vacation Request...');
        const reqRes = await axios.post(`${BASE_URL}/requests`, {
            type: 'VACATION',
            startDate: '2024-07-01',
            endDate: '2024-07-15',
            reason: 'Summer Vacation'
        }, { headers: { Authorization: `Bearer ${employeeToken}` } });
        requestId = reqRes.data.id;
        console.log(`✅ Request submitted. ID: ${requestId}`);

        // 5. Verify Request appears in Employee's list
        console.log('\n5. Verifying Employee Request List...');
        const myRequests = await axios.get(`${BASE_URL}/requests?mode=my-requests`, {
            headers: { Authorization: `Bearer ${employeeToken}` }
        });
        const foundMyReq = myRequests.data.find(r => r.id === requestId);
        if (foundMyReq) {
            console.log(`✅ Request found in employee list. Status: ${foundMyReq.status}`);
        } else {
            throw new Error('Request not found in employee list');
        }

        // 6. Approve Request (HR/Admin)
        console.log('\n6. Approving Request (Admin)...');
        await axios.put(`${BASE_URL}/requests/${requestId}/status`, {
            status: 'APPROVED',
            response: 'Approved by Admin'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('✅ Request approved.');

        // 7. Verify Status Updated
        console.log('\n7. Verifying Status Update...');
        const updatedRequests = await axios.get(`${BASE_URL}/requests?mode=my-requests`, {
            headers: { Authorization: `Bearer ${employeeToken}` }
        });
        const updatedReq = updatedRequests.data.find(r => r.id === requestId);
        if (updatedReq && updatedReq.status === 'APPROVED') {
            console.log(`✅ Request status is now: ${updatedReq.status}`);
        } else {
            throw new Error(`Request status mismatch. Expected APPROVED, got ${updatedReq?.status}`);
        }

        console.log('\n--- PHASE 4 VERIFICATION SUCCESSFUL ---');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error.response ? error.response.data : error.message);
    }
}

runVerification();
