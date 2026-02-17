import app from './app.js';
import config from './config/env.js';
import db from './db.js';

const server = app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`📦 Database: ${config.databaseUrl ? 'PostgreSQL' : 'SQLite'}`);
    console.log(`🌍 Environment: ${config.isProduction ? 'production' : 'development'}`);
});

// ─── Graceful Shutdown ──────────────────────────────────────
const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    server.close(async () => {
        console.log('HTTP server closed.');
        try {
            await db.close();
            console.log('Database connection closed.');
        } catch (err) {
            console.error('Error closing database:', err);
        }
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
    }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
