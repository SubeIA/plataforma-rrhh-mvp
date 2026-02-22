import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().transform(Number).default('3001'),
    JWT_SECRET: z.string().min(8, { message: "JWT_SECRET must be at least 8 characters long" }),
    DATABASE_URL: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CORS_ORIGINS: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables:', parsedEnv.error.format());
    process.exit(1);
}

const { PORT, JWT_SECRET, DATABASE_URL, NODE_ENV, CORS_ORIGINS } = parsedEnv.data;

const config = {
    port: PORT,
    jwtSecret: JWT_SECRET,
    databaseUrl: DATABASE_URL || null,
    isProduction: NODE_ENV === 'production',
    corsOrigins: CORS_ORIGINS === '*'
        ? '*'
        : CORS_ORIGINS
            ? CORS_ORIGINS.split(',')
            : ['http://localhost:3000', 'http://localhost:3001', 'https://plataforma-rrhh-mvp.vercel.app', 'https://www.plataforma-rrhh-mvp.vercel.app'],
};

export default config;
