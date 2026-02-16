
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json());

// --- AUTHENTICATION ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const users = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        const user = users[0];

        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    try {
        const result = await db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hash]);
        res.json({ id: result.id, email });
    } catch (err) {
        res.status(500).json({ error: 'Email already exists' });
    }
});


// --- ATTENDANCE ---
// Middleware to verify token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Helper to calculate distance in meters (Haversine Formula)
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

app.post('/api/attendance', verifyToken, async (req, res) => {
    const { type, lat, lng, accuracy } = req.body; // 'IN' or 'OUT', plus coords
    const userId = req.user.id;

    try {
        // Geolocation Validation (Phase 6)
        if (lat && lng) {
            const offices = await db.query("SELECT * FROM offices");

            // If offices exist, check if user is within range of ANY office
            if (offices.length > 0) {
                let withinRange = false;

                for (const office of offices) {
                    const distance = getDistanceInMeters(lat, lng, office.lat, office.lng);
                    if (distance <= office.radius) {
                        withinRange = true;
                        break;
                    }
                }

                if (!withinRange) {
                    console.warn(`User ${userId} punched outside range. Coords: ${lat},${lng}`);
                }
            }
            await insertAttendance(userId, type, lat, lng, accuracy, res);
        } else {
            await insertAttendance(userId, type, null, null, null, res);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

async function insertAttendance(userId, type, lat, lng, accuracy, res) {
    try {
        const result = await db.run("INSERT INTO attendance (userId, type, lat, lng, accuracy) VALUES (?, ?, ?, ?, ?)", [userId, type, lat, lng, accuracy]);
        res.json({ id: result.id, type, timestamp: new Date() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// --- ATTENDANCE MANAGEMENT ---

// GET Attendance (with filters)
app.get('/api/attendance', verifyToken, async (req, res) => {
    // If not admin/hr, only show own attendance
    const isIdsAllowed = req.user.role === 'admin' || req.user.role === 'hr';
    const { userId, startDate, endDate } = req.query;

    try {
        let sql = `
            SELECT a.id, a.type, a.timestamp, u.email, p.fullName, p.department 
            FROM attendance a 
            JOIN users u ON a.userId = u.id 
            LEFT JOIN profiles p ON u.id = p.userId
            WHERE 1=1
        `;
        const params = [];

        if (!isIdsAllowed) {
            sql += " AND a.userId = ?";
            params.push(req.user.id);
        } else if (userId) {
            sql += " AND a.userId = ?";
            params.push(userId);
        }

        if (startDate) {
            sql += " AND a.timestamp >= ?";
            params.push(startDate);
        }
        if (endDate) {
            sql += " AND a.timestamp <= ?";
            params.push(endDate);
        }

        sql += " ORDER BY a.timestamp DESC LIMIT 100";

        const rows = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MANUAL ATTENDANCE ENTRY (HR/Admin)
app.post('/api/attendance/manual', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    const { userId, type, timestamp } = req.body;

    try {
        const result = await db.run("INSERT INTO attendance (userId, type, timestamp) VALUES (?, ?, ?)", [userId, type, timestamp]);
        res.json({ id: result.id, message: 'Record added manually' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CORRECT ATTENDANCE (HR/Admin)
app.put('/api/attendance/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    const { id } = req.params;
    const { type, timestamp } = req.body;

    try {
        await db.run("UPDATE attendance SET type = ?, timestamp = ? WHERE id = ?", [type, timestamp, id]);
        res.json({ message: 'Record updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attendance/history', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const rows = await db.query("SELECT * FROM attendance WHERE userId = ? ORDER BY timestamp DESC LIMIT 10", [userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DOCUMENT MANAGEMENT ---

// Upload Document (HR/Admin)
app.post('/api/documents/upload', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    const { userId, name, url } = req.body;

    try {
        const result = await db.run("INSERT INTO documents (userId, name, url) VALUES (?, ?, ?)", [userId, name, url]);
        res.json({ id: result.id, message: 'Document uploaded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get My Documents (Employee)
app.get('/api/documents/my-documents', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const rows = await db.query("SELECT * FROM documents WHERE userId = ? ORDER BY createdAt DESC", [userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sign Document (Employee)
app.post('/api/documents/:id/sign', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const docId = req.params.id;

    try {
        const docs = await db.query("SELECT * FROM documents WHERE id = ? AND userId = ?", [docId, userId]);
        const doc = docs[0];

        if (!doc) return res.status(404).json({ error: 'Document not found' });
        if (doc.status === 'SIGNED') return res.status(400).json({ error: 'Document already signed' });

        const signedAt = new Date().toISOString();
        await db.run("UPDATE documents SET status = 'SIGNED', signedAt = ? WHERE id = ?", [signedAt, docId]);
        res.json({ message: 'Document signed successfully', signedAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN USER MANAGEMENT ---

// GET All Users with Profile
app.get('/api/users', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    const sql = `
        SELECT u.id, u.email, u.role, 
               p.fullName, p.phone, p.address, p.department, p.position, p.startDate
        FROM users u
        LEFT JOIN profiles p ON u.id = p.userId
    `;
    try {
        const rows = await db.query(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE User & Profile
app.post('/api/users', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { email, password, role, fullName, phone, address, department, position, startDate } = req.body;

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    try {
        // Note: Transactions are hard without a proper client object in pg/sqlite abstraction.
        // We will execute sequentially.
        const userResult = await db.run("INSERT INTO users (email, password, role) VALUES (?, ?, ?)", [email, hash, role]);
        const userId = userResult.id;

        await db.run(`
            INSERT INTO profiles (userId, fullName, phone, address, department, position, startDate)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [userId, fullName, phone, address, department, position, startDate]);

        res.json({ id: userId, email, role, fullName, department, position });
    } catch (err) {
        res.status(500).json({ error: 'Error creating user/profile. Email might exist.' });
    }
});

// UPDATE User & Profile
app.put('/api/users/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const { email, role, fullName, phone, address, department, position, startDate } = req.body;

    try {
        // Update User
        await db.run("UPDATE users SET email = ?, role = ? WHERE id = ?", [email, role, id]);

        // Upsert Profile
        const sqlProfile = `
            INSERT INTO profiles (userId, fullName, phone, address, department, position, startDate)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(userId) DO UPDATE SET
            fullName = excluded.fullName,
            phone = excluded.phone,
            address = excluded.address,
            department = excluded.department,
            position = excluded.position,
            startDate = excluded.startDate
        `;
        await db.run(sqlProfile, [id, fullName, phone, address, department, position, startDate]);

        res.json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE User
app.delete('/api/users/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;

    try {
        await db.run("DELETE FROM users WHERE id = ?", [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REQUESTS MANAGEMENT (PHASE 4) ---

// Create Request (Employee)
app.post('/api/requests', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { type, startDate, endDate, reason } = req.body;

    try {
        const result = await db.run("INSERT INTO requests (userId, type, startDate, endDate, reason) VALUES (?, ?, ?, ?, ?)", [userId, type, startDate, endDate, reason]);
        res.json({ id: result.id, message: 'Request submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Requests (All for HR/Admin, filtered for User)
app.get('/api/requests', verifyToken, async (req, res) => {
    const isHr = req.user.role === 'admin' || req.user.role === 'hr';
    const { mode } = req.query; // 'my-requests' to force own list even if HR

    let sql = `
        SELECT r.*, u.email, p.fullName, p.department
        FROM requests r
        JOIN users u ON r.userId = u.id
        LEFT JOIN profiles p ON u.id = p.userId
    `;
    const params = [];

    if (!isHr || mode === 'my-requests') {
        sql += " WHERE r.userId = ?";
        params.push(req.user.id);
    }

    sql += " ORDER BY r.createdAt DESC";

    try {
        const rows = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Request Status (HR/Admin)
app.put('/api/requests/:id/status', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    const { id } = req.params;
    const { status, response } = req.body;

    try {
        await db.run("UPDATE requests SET status = ?, response = ? WHERE id = ?", [status, response, id]);
        res.json({ message: 'Request updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SHIFT MANAGEMENT (PHASE 5) ---

// Create Shift
app.post('/api/shifts', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { name, startTime, endTime, toleranceMinutes } = req.body;

    try {
        const result = await db.run("INSERT INTO shifts (name, startTime, endTime, toleranceMinutes) VALUES (?, ?, ?, ?)", [name, startTime, endTime, toleranceMinutes]);
        res.json({ id: result.id, message: 'Shift created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Shifts
app.get('/api/shifts', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    try {
        const rows = await db.query("SELECT * FROM shifts");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign Shift to User
app.post('/api/shifts/assign', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    const { userId, shiftId, startDate, endDate } = req.body;

    try {
        const result = await db.run("INSERT INTO user_shifts (userId, shiftId, startDate, endDate) VALUES (?, ?, ?, ?)", [userId, shiftId, startDate, endDate]);
        res.json({ id: result.id, message: 'Shift assigned successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get User's Current Shift
app.get('/api/users/:id/shift', verifyToken, async (req, res) => {
    const { id } = req.params;
    // Basic logic: get the latest assignment that is active
    const today = new Date().toISOString().split('T')[0];

    const sql = `
        SELECT s.*, us.startDate, us.endDate
        FROM user_shifts us
        JOIN shifts s ON us.shiftId = s.id
        WHERE us.userId = ? 
        AND (us.endDate IS NULL OR us.endDate >= ?)
        ORDER BY us.startDate DESC LIMIT 1
    `;

    try {
        const rows = await db.query(sql, [id, today]);
        res.json(rows[0] || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attendance/all', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const rows = await db.query(`
            SELECT a.id, a.type, a.timestamp, u.email 
            FROM attendance a 
            JOIN users u ON a.userId = u.id 
            ORDER BY a.timestamp DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REPORTING (PHASE 7) ---

// Helper to calculate hours between two dates
function getHoursDifference(date1, date2) {
    const diffMs = Math.abs(date2 - date1);
    return diffMs / (1000 * 60 * 60);
}

// Generate Payroll Report (JSON)
app.get('/api/reports/payroll', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate are required' });

    const sql = `
        SELECT u.id, u.email, p.fullName, p.department, 
               a.type, a.timestamp
        FROM users u
        LEFT JOIN profiles p ON u.id = p.userId
        LEFT JOIN attendance a ON u.id = a.userId
        WHERE a.timestamp BETWEEN ? AND ?
        ORDER BY u.id, a.timestamp ASC
    `;

    // Append end of day to endDate for inclusive query
    const queryEndDate = endDate + 'T23:59:59';
    const queryStartDate = startDate + 'T00:00:00';

    try {
        const rows = await db.query(sql, [queryStartDate, queryEndDate]);

        // Process rows to calculate hours
        const report = {};

        rows.forEach(row => {
            if (!report[row.id]) {
                report[row.id] = {
                    id: row.id,
                    email: row.email,
                    fullName: row.fullName || 'N/A',
                    department: row.department || 'N/A',
                    totalHours: 0,
                    daysWorked: 0,
                    records: []
                };
            }
            report[row.id].records.push(row);
        });

        // Calculate hours per user
        Object.values(report).forEach(user => {
            let currentIn = null;
            let days = new Set();

            user.records.forEach(record => {
                const time = new Date(record.timestamp);
                days.add(time.toDateString());

                if (record.type === 'IN') {
                    if (currentIn) {
                        // Missing OUT
                    }
                    currentIn = time;
                } else if (record.type === 'OUT') {
                    if (currentIn) {
                        const hours = getHoursDifference(currentIn, time);
                        user.totalHours += hours;
                        currentIn = null;
                    }
                }
            });
            user.daysWorked = days.size;
            delete user.records; // cleanup raw records
            user.totalHours = parseFloat(user.totalHours.toFixed(2));
        });

        res.json(Object.values(report));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
