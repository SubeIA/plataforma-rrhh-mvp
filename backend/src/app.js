import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import config from './config/env.js';
import errorHandler from './middleware/errorHandler.js';
import sanitize from './middleware/sanitize.js';
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
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// ─── Cookies ────────────────────────────────────────────────
app.use(cookieParser());

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
    max: 7,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: true, message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.' },
});

app.use(generalLimiter);

// ─── Logging ────────────────────────────────────────────────
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// ─── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ─── Input Sanitization ────────────────────────────────────
app.use(sanitize);

// ─── CSRF Protection (Origin Check) ────────────────────────
app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.headers.origin;
    const allowedOrigins = Array.isArray(config.corsOrigins) ? config.corsOrigins : [];
    if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: true, message: 'Origin not allowed' });
    }
    next();
});

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
