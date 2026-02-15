
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';

const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
        )`);

        // Profiles Table
        db.run(`CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER UNIQUE,
            fullName TEXT,
            phone TEXT,
            address TEXT,
            department TEXT,
            position TEXT,
            startDate DATE,
            FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )`);

        // Attendance Table
        db.run(`CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            type TEXT, -- 'IN' or 'OUT'
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            lat REAL,
            lng REAL,
            accuracy REAL,
            FOREIGN KEY(userId) REFERENCES users(id)
        )`);

        // Documents Table
        db.run(`CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            name TEXT,
            url TEXT,
            status TEXT DEFAULT 'PENDING', -- 'PENDING', 'SIGNED'
            signedAt DATETIME,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )`);

        // Requests Table (Phase 4)
        db.run(`CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            type TEXT, -- VACATION, SICK, PERMIT, OTHER
            startDate TEXT,
            endDate TEXT,
            reason TEXT,
            status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
            response TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )`);

        // Shifts Table (Phase 5)
        db.run(`CREATE TABLE IF NOT EXISTS shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            startTime TEXT, -- '09:00'
            endTime TEXT,   -- '18:00'
            toleranceMinutes INTEGER DEFAULT 0
        )`);

        // User Shifts Table (Assignment)
        db.run(`CREATE TABLE IF NOT EXISTS user_shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            shiftId INTEGER,
            startDate TEXT,
            endDate TEXT, -- Null means current/indefinite
            FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(shiftId) REFERENCES shifts(id) ON DELETE CASCADE
            FOREIGN KEY(shiftId) REFERENCES shifts(id) ON DELETE CASCADE
        )`);

        // Offices Table (Phase 6)
        db.run(`CREATE TABLE IF NOT EXISTS offices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            lat REAL,
            lng REAL,
            radius INTEGER DEFAULT 100 -- meters
        )`);

        // Seed Office (Example: Main Office)
        db.get("SELECT * FROM offices WHERE name = ?", ['Main Office'], (err, row) => {
            if (!row) {
                db.run("INSERT INTO offices (name, lat, lng, radius) VALUES (?, ?, ?, ?)", ['Main Office', -33.4489, -70.6693, 200]);
            }
        });

        // Seed Admin User
        const adminEmail = 'admin@test.com';
        const adminPassword = 'admin'; // In production, use strong passwords
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(adminPassword, salt);

        db.get("SELECT * FROM users WHERE email = ?", [adminEmail], (err, row) => {
            if (!row) {
                const stmt = db.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)");
                stmt.run(adminEmail, hash, 'admin');
                stmt.finalize();
                console.log('Admin user created: admin@test.com / admin');
            }
        });
    });
}

export default db;
