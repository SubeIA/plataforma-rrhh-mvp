import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { handleChat, getAggregatedTokenUsage } from '../controllers/aiController.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = Router();

// All AI queries must be authenticated.
router.use(verifyToken);

// AI-01 FIX: Per-user rate limiter (30 messages/hour per user UID).
// This is separate from the global IP-based rate limit in app.js.
// Prevents a single user from exhausting OpenAI/Gemini API credits.
const aiChatRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000,   // 1 hour window
    max: 30,                      // max 30 requests per user per hour
    keyGenerator: (req) => req.user?.uid ?? req.ip,  // per user, fallback to IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Has alcanzado el límite de consultas de IA (30/hora). Intenta nuevamente más tarde.',
        retryAfter: '1 hora'
    },
    // Skip rate limiting for super_admin (internal testing)
    skip: (req) => req.user?.role === 'super_admin'
});

router.post('/chat', aiChatRateLimit, handleChat);
router.get('/token-usage', requirePermission(PERMISSIONS.VIEW_ANALYTICS), getAggregatedTokenUsage);

export default router;
