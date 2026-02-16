
import sqlite3 from 'sqlite3';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const isPostgres = !!process.env.DATABASE_URL;
let db;

if (isPostgres) {
    db = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    console.log('Connected to PostgreSQL database.');
    initializeTables();
} else {
    db = new sqlite3.Database('./database.sqlite', (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        } else {
            console.log('Connected to the SQLite database.');
            initializeTables();
        }
    });
}


// Helper to normalize queries between SQLite (?) and Postgres ($1, $2)
async function query(sql, params = []) {
    if (isPostgres) {
        // Convert ? to $1, $2, etc.
        let paramCount = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);
        try {
            const result = await db.query(pgSql, params);
            return result.rows; // Returns array of rows
        } catch (err) {
            console.error('Database Query Error (PG):', err);
            throw err;
        }
    } else {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Database Query Error (SQLite):', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

async function get(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0];
}

async function run(sql, params = []) {
    if (isPostgres) {
        // PG uses query for everything
        // Auto-append RETURNING id for INSERTs if not present, to match SQLite this.lastID behavior
        if (sql.trim().toUpperCase().startsWith('INSERT') && !sql.toUpperCase().includes('RETURNING')) {
            sql += ' RETURNING id';
        }

        // Convert ? to $1, $2, etc.
        let paramCount = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);

        try {
            const result = await db.query(pgSql, params);
            // If we have rows (from RETURNING), return the first row's id as 'id'
            // SQLite returns 'id' as 'lastID', here we standardize to { id: ... }
            const res = { changes: result.rowCount };
            if (result.rows.length > 0 && result.rows[0].id) {
                res.id = result.rows[0].id;
            }
            return res;
        } catch (err) {
            console.error('Database Run Error (PG):', err);
            throw err;
        }
    } else {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) {
                    console.error('Database Run Error (SQLite):', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }
}


async function initializeTables() {
    const idType = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    const timestampType = isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';

    const tables = [
        // Users Table
        `CREATE TABLE IF NOT EXISTS users (
            id ${idType},
            email TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
        )`,
        // Profiles Table
        `CREATE TABLE IF NOT EXISTS profiles (
            id ${idType},
            userId INTEGER UNIQUE,
            fullName TEXT,
            phone TEXT,
            address TEXT,
            department TEXT,
            position TEXT,
            startDate DATE,
            FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )`,
        // Attendance Table
        `CREATE TABLE IF NOT EXISTS attendance (
            id ${idType},
            userId INTEGER,
            type TEXT, -- 'IN' or 'OUT'
            timestamp ${timestampType},
            lat REAL,
            lng REAL,
            accuracy REAL,
            FOREIGN KEY(userId) REFERENCES users(id)
        )`,
        // Documents Table
        `CREATE TABLE IF NOT EXISTS documents (
            id ${idType},
            userId INTEGER,
            name TEXT,
            url TEXT,
            status TEXT DEFAULT 'PENDING',
            signedAt ${timestampType},
            createdAt ${timestampType},
            FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )`,
        // Requests Table
        `CREATE TABLE IF NOT EXISTS requests (
            id ${idType},
            userId INTEGER,
            type TEXT,
            startDate TEXT,
            endDate TEXT,
            reason TEXT,
            status TEXT DEFAULT 'PENDING',
            response TEXT,
            createdAt ${timestampType},
            FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )`,
        // Shifts Table
        `CREATE TABLE IF NOT EXISTS shifts (
            id ${idType},
            name TEXT,
            startTime TEXT,
            endTime TEXT,
            toleranceMinutes INTEGER DEFAULT 0
        )`,
        // User Shifts Table
        `CREATE TABLE IF NOT EXISTS user_shifts (
            id ${idType},
            userId INTEGER,
            shiftId INTEGER,
            startDate TEXT,
            endDate TEXT,
            FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(shiftId) REFERENCES shifts(id) ON DELETE CASCADE
        )`,
        // Offices Table
        `CREATE TABLE IF NOT EXISTS offices (
            id ${idType},
            name TEXT,
            lat REAL,
            lng REAL,
            radius INTEGER DEFAULT 100
        )`
    ];

    try {
        for (const sql of tables) {
            await run(sql);
        }
        console.log('All tables initialized.');

        // Seed Office
        const office = await get("SELECT * FROM offices WHERE name = ?", ['Main Office']);
        if (!office) {
            await run("INSERT INTO offices (name, lat, lng, radius) VALUES (?, ?, ?, ?)", ['Main Office', -33.4489, -70.6693, 200]);
            console.log('Seeded Main Office');
        }

        // Seed Admin User
        const adminEmail = 'admin@test.com';
        const adminPassword = 'admin';
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(adminPassword, salt);

        const admin = await get("SELECT * FROM users WHERE email = ?", [adminEmail]);
        if (!admin) {
            await run("INSERT INTO users (email, password, role) VALUES (?, ?, ?)", [adminEmail, hash, 'admin']);
            console.log('Admin user created: admin@test.com / admin');
        } else {
            console.log('Admin user already exists.');
        }

    } catch (err) {
        console.error('Error in initializeTables:', err);
    }
}

// Export a unified, promisified interface
export default {
    query,
    get,
    run
};
