import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    API_PORT: z.string().transform(Number).default('3001'),
    JWT_SECRET: z.string().optional(),
    DATABASE_URL: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CORS_ORIGINS: z.string().optional(),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().min(5).optional(),
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    PINECONE_API_KEY: z.string().optional(),
    PINECONE_INDEX_NAME: z.string().default('codigo-trabajo-chile'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables:', parsedEnv.error.format());
    process.exit(1);
}

const {
    API_PORT, JWT_SECRET, DATABASE_URL, NODE_ENV, CORS_ORIGINS,
    ADMIN_EMAIL, ADMIN_PASSWORD,
    OPENAI_API_KEY, GEMINI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME
} = parsedEnv.data;

const config = {
    port: API_PORT,
    jwtSecret: JWT_SECRET || (NODE_ENV === 'production'
        ? (console.error('❌ JWT_SECRET must be set in production!'), process.exit(1))
        : 'dev-secret-key-at-least-32-chars-long-123456'),
    databaseUrl: DATABASE_URL || null,
    isProduction: NODE_ENV === 'production',
    corsOrigins: CORS_ORIGINS === '*'
        ? '*'
        : CORS_ORIGINS
            ? CORS_ORIGINS.split(',')
            : ['http://localhost:3000', 'http://localhost:3001'],
    adminEmail: ADMIN_EMAIL || null,
    adminPassword: ADMIN_PASSWORD || null,
    ai: {
        openaiApiKey: OPENAI_API_KEY || null,
        geminiApiKey: GEMINI_API_KEY || null,
        pineconeApiKey: PINECONE_API_KEY || null,
        pineconeIndexName: PINECONE_INDEX_NAME || 'codigo-trabajo-chile'
    }
};

export default config;
