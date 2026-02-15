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
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    });
});

app.post('/api/auth/register', (req, res) => {
    const { email, password } = req.body;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const stmt = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)");
    stmt.run(email, hash, function (err) {
        if (err) return res.status(500).json({ error: 'Email already exists' });
        res.json({ id: this.lastID, email });
    });
    stmt.finalize();
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

app.post('/api/attendance', verifyToken, (req, res) => {
    const { type, lat, lng, accuracy } = req.body; // 'IN' or 'OUT', plus coords
    const userId = req.user.id;

    // Geolocation Validation (Phase 6)
    if (lat && lng) {
        db.all("SELECT * FROM offices", [], (err, offices) => {
            if (err) return res.status(500).json({ error: err.message });

            // If offices exist, check if user is within range of ANY office
            if (offices.length > 0) {
                let withinRange = false;
                let nearbyOffice = null;

                for (const office of offices) {
                    const distance = getDistanceInMeters(lat, lng, office.lat, office.lng);
                    // Add accuracy buffer? For now, straight radius
                    if (distance <= office.radius) {
                        withinRange = true;
                        nearbyOffice = office.name;
                        break;
                    }
                }

                if (!withinRange) {
                    // Strict mode: Reject
                    // return res.status(403).json({ error: 'You are outside the allowed office range.' });

                    // Audit mode: Allow but flag (for now, just log or add valid flag column later)
                    console.warn(`User ${userId} punched outside range. Coords: ${lat},${lng}`);
                }
            }

            // Proceed to insert
            insertAttendance(userId, type, lat, lng, accuracy, res);
        });
    } else {
        // No coords provided (Web/Desktop without GPS?) -> Allow or Block?
        // Phase 6 requirement: "Capturar GPS". If missing, maybe block?
        // For existing web usage on localhost, strictly blocking might break testing if no mock.
        // We will proceed but log warning.
        insertAttendance(userId, type, null, null, null, res);
    }
});

function insertAttendance(userId, type, lat, lng, accuracy, res) {
    const stmt = db.prepare("INSERT INTO attendance (userId, type, lat, lng, accuracy) VALUES (?, ?, ?, ?, ?)");
    stmt.run(userId, type, lat, lng, accuracy, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, type, timestamp: new Date() });
    });
    stmt.finalize();
}

// --- ATTENDANCE MANAGEMENT ---

// GET Attendance (with filters)
app.get('/api/attendance', verifyToken, (req, res) => {
    // If not admin/hr, only show own attendance
    const isIdsAllowed = req.user.role === 'admin' || req.user.role === 'hr';
    const { userId, startDate, endDate } = req.query;

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

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// MANUAL ATTENDANCE ENTRY (HR/Admin)
app.post('/api/attendance/manual', verifyToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    const { userId, type, timestamp } = req.body;

    const stmt = db.prepare("INSERT INTO attendance (userId, type, timestamp) VALUES (?, ?, ?)");
    stmt.run(userId, type, timestamp, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Record added manually' });
    });
    stmt.finalize();
});

// CORRECT ATTENDANCE (HR/Admin)
app.put('/api/attendance/:id', verifyToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    const { id } = req.params;
    const { type, timestamp } = req.body; // In a real app, adding 'reason' column would be good

    const stmt = db.prepare("UPDATE attendance SET type = ?, timestamp = ? WHERE id = ?");
    stmt.run(type, timestamp, id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Record updated successfully' });
    });
    stmt.finalize();
});

app.get('/api/attendance/history', verifyToken, (req, res) => {
    const userId = req.user.id;
    db.all("SELECT * FROM attendance WHERE userId = ? ORDER BY timestamp DESC LIMIT 10", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- DOCUMENT MANAGEMENT ---

// Upload Document (HR/Admin)
app.post('/api/documents/upload', verifyToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    const { userId, name, url } = req.body; // In real app, handle file upload with multer

    const stmt = db.prepare("INSERT INTO documents (userId, name, url) VALUES (?, ?, ?)");
    stmt.run(userId, name, url, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Document uploaded successfully' });
    });
    stmt.finalize();
});

// Get My Documents (Employee)
app.get('/api/documents/my-documents', verifyToken, (req, res) => {
    const userId = req.user.id;
    db.all("SELECT * FROM documents WHERE userId = ? ORDER BY createdAt DESC", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Sign Document (Employee)
app.post('/api/documents/:id/sign', verifyToken, (req, res) => {
    const userId = req.user.id;
    const docId = req.params.id;

    // Verify ownership
    db.get("SELECT * FROM documents WHERE id = ? AND userId = ?", [docId, userId], (err, doc) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        if (doc.status === 'SIGNED') return res.status(400).json({ error: 'Document already signed' });

        const signedAt = new Date().toISOString();
        db.run("UPDATE documents SET status = 'SIGNED', signedAt = ? WHERE id = ?", [signedAt, docId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Document signed successfully', signedAt });
        });
    });
});

// --- ADMIN USER MANAGEMENT ---

// GET All Users with Profile
app.get('/api/users', verifyToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    const sql = `
        SELECT u.id, u.email, u.role, 
               p.fullName, p.phone, p.address, p.department, p.position, p.startDate
        FROM users u
        LEFT JOIN profiles p ON u.id = p.userId
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CREATE User & Profile
app.post('/api/users', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { email, password, role, fullName, phone, address, department, position, startDate } = req.body;

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // Transaction-like approach (SQLite serialized)
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        const stmtUser = db.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)");
        stmtUser.run(email, hash, role, function (err) {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: 'Email already exists or error creating user' });
            }
            const userId = this.lastID;

            const stmtProfile = db.prepare(`
                INSERT INTO profiles (userId, fullName, phone, address, department, position, startDate)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            stmtProfile.run(userId, fullName, phone, address, department, position, startDate, function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: 'Error creating profile' });
                }
                db.run("COMMIT");
                res.json({ id: userId, email, role, fullName, department, position });
            });
            stmtProfile.finalize();
        });
        stmtUser.finalize();
    });
});

// UPDATE User & Profile
app.put('/api/users/:id', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const { email, role, fullName, phone, address, department, position, startDate } = req.body;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Update User
        const sqlUser = "UPDATE users SET email = ?, role = ? WHERE id = ?";
        db.run(sqlUser, [email, role, id], function (err) {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
            }

            // Upsert Profile (Update if exists, Insert if not)
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

            db.run(sqlProfile, [id, fullName, phone, address, department, position, startDate], function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: 'Error updating profile' });
                }
                db.run("COMMIT");
                res.json({ message: 'User updated successfully' });
            });
        });
    });
});

// DELETE User
app.delete('/api/users/:id', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;

    db.run("DELETE FROM users WHERE id = ?", id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User deleted' });
    });
});

// --- REQUESTS MANAGEMENT (PHASE 4) ---

// Create Request (Employee)
app.post('/api/requests', verifyToken, (req, res) => {
    const userId = req.user.id;
    const { type, startDate, endDate, reason } = req.body;

    const stmt = db.prepare("INSERT INTO requests (userId, type, startDate, endDate, reason) VALUES (?, ?, ?, ?, ?)");
    stmt.run(userId, type, startDate, endDate, reason, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Request submitted successfully' });
    });
    stmt.finalize();
});

// Get Requests (All for HR/Admin, filtered for User)
app.get('/api/requests', verifyToken, (req, res) => {
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

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update Request Status (HR/Admin)
app.put('/api/requests/:id/status', verifyToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    const { id } = req.params;
    const { status, response } = req.body; // text response from HR

    const stmt = db.prepare("UPDATE requests SET status = ?, response = ? WHERE id = ?");
    stmt.run(status, response, id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Request updated successfully' });
    });
    stmt.finalize();
});

// --- SHIFT MANAGEMENT (PHASE 5) ---

// Create Shift
app.post('/api/shifts', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { name, startTime, endTime, toleranceMinutes } = req.body;

    const stmt = db.prepare("INSERT INTO shifts (name, startTime, endTime, toleranceMinutes) VALUES (?, ?, ?, ?)");
    stmt.run(name, startTime, endTime, toleranceMinutes, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Shift created successfully' });
    });
    stmt.finalize();
});

// Get All Shifts
app.get('/api/shifts', verifyToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    db.all("SELECT * FROM shifts", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Assign Shift to User
app.post('/api/shifts/assign', verifyToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') return res.sendStatus(403);
    const { userId, shiftId, startDate, endDate } = req.body;

    const stmt = db.prepare("INSERT INTO user_shifts (userId, shiftId, startDate, endDate) VALUES (?, ?, ?, ?)");
    stmt.run(userId, shiftId, startDate, endDate, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Shift assigned successfully' });
    });
    stmt.finalize();
});

// Get User's Current Shift
app.get('/api/users/:id/shift', verifyToken, (req, res) => {
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

    db.get(sql, [id, today], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || null);
    });
});

app.get('/api/attendance/all', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    db.all(`
        SELECT a.id, a.type, a.timestamp, u.email 
        FROM attendance a 
        JOIN users u ON a.userId = u.id 
        ORDER BY a.timestamp DESC 
        LIMIT 50
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- REPORTING (PHASE 7) ---

// Helper to calculate hours between two dates
function getHoursDifference(date1, date2) {
    const diffMs = Math.abs(date2 - date1);
    return diffMs / (1000 * 60 * 60);
}

// Generate Payroll Report (JSON)
app.get('/api/reports/payroll', verifyToken, (req, res) => {
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

    db.all(sql, [queryStartDate, queryEndDate], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

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
                        // Missing OUT for previous IN, ignore or flag? 
                        // For MVP, we just reset start time to latest IN
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
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', database: 'SQLite', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
