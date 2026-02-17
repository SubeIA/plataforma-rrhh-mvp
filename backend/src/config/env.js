import dotenv from 'dotenv';
dotenv.config();

const config = {
    port: parseInt(process.env.PORT, 10) || 3001,
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL || null,
    isProduction: process.env.NODE_ENV === 'production',
    corsOrigins: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : ['http://localhost:3000', 'http://localhost:3001'],
};

// Validate required env vars
if (!config.jwtSecret) {
    console.warn('⚠️  JWT_SECRET not set in .env — using fallback (NOT safe for production)');
    config.jwtSecret = 'dev-fallback-secret-change-me';
}

export default config;
