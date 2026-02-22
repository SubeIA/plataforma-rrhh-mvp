import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config/env.js';
import errorHandler from './middleware/errorHandler.js';
import db from './db.js';

// Route imports
import authRoutes from './routes/auth.js';
import attendanceRoutes from './routes/attendance.js';
import documentsRoutes from './routes/documents.js';
import usersRoutes from './routes/users.js';
import requestsRoutes from './routes/requests.js';
import shiftsRoutes from './routes/shifts.js';
import reportsRoutes from './routes/reports.js';

const app = express();

// ─── Security ───────────────────────────────────────────────
app.use(helmet());

// ─── CORS ───────────────────────────────────────────────────
app.use(
    cors({
        origin: config.corsOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// ─── Rate Limiting ──────────────────────────────────────────
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: true, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: true, message: 'Too many login attempts, please try again later.' },
});

app.use(generalLimiter);

// ─── Logging ────────────────────────────────────────────────
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// ─── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));


// ─── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/reports', reportsRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        database: config.databaseUrl ? 'PostgreSQL' : 'SQLite',
        timestamp: new Date().toISOString(),
    });
});

// ─── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: true, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler (must be last) ────────────────────
app.use(errorHandler);

export default app;
