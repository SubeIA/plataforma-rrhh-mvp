import sqlite3 from 'sqlite3';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import config from './config/env.js';

const isPostgres = !!config.databaseUrl;
let db;

if (isPostgres) {
    db = new pg.Pool({
        connectionString: config.databaseUrl,
        ssl: config.isProduction
            ? { rejectUnauthorized: false }
            : { rejectUnauthorized: false },
    });
    console.log('📦 Connected to PostgreSQL database.');
    initializeTables();
} else {
    db = new sqlite3.Database('./database.sqlite', (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        } else {
            console.log('📦 Connected to the SQLite database.');
            initializeTables();
        }
    });
}

/**
 * Run a SELECT query. Returns array of rows.
 */
async function query(sql, params = []) {
    if (isPostgres) {
        let paramCount = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);
        const result = await db.query(pgSql, params);
        return result.rows;
    } else {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

/**
 * Run a SELECT query and return only the first row.
 */
async function get(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0];
}

/**
 * Run an INSERT/UPDATE/DELETE statement. Returns { id, changes }.
 */
async function run(sql, params = []) {
    if (isPostgres) {
        if (sql.trim().toUpperCase().startsWith('INSERT') && !sql.toUpperCase().includes('RETURNING')) {
            sql += ' RETURNING id';
        }

        let paramCount = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);

        const result = await db.query(pgSql, params);
        const res = { changes: result.rowCount };
        if (result.rows.length > 0 && result.rows[0].id) {
            res.id = result.rows[0].id;
        }
        return res;
    } else {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }
}

/**
 * Gracefully close the database connection.
 */
async function close() {
    if (isPostgres) {
        await db.end();
    } else {
        return new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

/**
 * Initialize all tables and seed data.
 */
async function initializeTables() {
    const idType = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    const timestampType = isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';

    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
            id ${idType},
            email TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
        )`,
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
        `CREATE TABLE IF NOT EXISTS attendance (
            id ${idType},
            userId INTEGER,
            type TEXT,
            timestamp ${timestampType},
            lat REAL,
            lng REAL,
            accuracy REAL,
            FOREIGN KEY(userId) REFERENCES users(id)
        )`,
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
        `CREATE TABLE IF NOT EXISTS shifts (
            id ${idType},
            name TEXT,
            startTime TEXT,
            endTime TEXT,
            toleranceMinutes INTEGER DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS user_shifts (
            id ${idType},
            userId INTEGER,
            shiftId INTEGER,
            startDate TEXT,
            endDate TEXT,
            FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(shiftId) REFERENCES shifts(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS offices (
            id ${idType},
            name TEXT,
            lat REAL,
            lng REAL,
            radius INTEGER DEFAULT 100
        )`,
        `CREATE TABLE IF NOT EXISTS audit_log (
            id ${idType},
            userId INTEGER,
            action TEXT,
            tableName TEXT,
            recordId INTEGER,
            details TEXT,
            timestamp ${timestampType}
        )`,
    ];

    try {
        for (const sql of tables) {
            await run(sql);
        }
        console.log('✅ All tables initialized.');

        // Seed Office
        const office = await get("SELECT * FROM offices WHERE name = ?", ['Main Office']);
        if (!office) {
            await run("INSERT INTO offices (name, lat, lng, radius) VALUES (?, ?, ?, ?)", ['Main Office', -33.4489, -70.6693, 200]);
            console.log('🏢 Seeded Main Office');
        }

        // Seed Admin User
        const adminEmail = config.adminEmail || 'admin@test.cl';
        const adminPassword = config.adminPassword || 'admin';

        if (adminEmail && adminPassword) {
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(adminPassword, salt);

            const admin = await get("SELECT * FROM users WHERE email = ?", [adminEmail]);
            if (!admin) {
                await run("INSERT INTO users (email, password, role) VALUES (?, ?, ?)", [adminEmail, hash, 'admin']);
                console.log(`👤 Admin user created: ${adminEmail}`);
            } else {
                console.log(`👤 Admin user already exists: ${adminEmail}`);
            }
        }
    } catch (err) {
        console.error('Error in initializeTables:', err);
    }
}

/**
 * Log an audit event for data modifications.
 */
async function audit(userId, action, tableName, recordId, details = null) {
    try {
        await run(
            'INSERT INTO audit_log (userId, action, tableName, recordId, details) VALUES (?, ?, ?, ?, ?)',
            [userId, action, tableName, recordId, details ? JSON.stringify(details) : null]
        );
    } catch (err) {
        console.error('Audit log error:', err);
    }
}

export default { query, get, run, close, initializeTables, audit };
