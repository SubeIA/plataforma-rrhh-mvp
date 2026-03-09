import { Router } from 'express';
import { handleChat, getAggregatedTokenUsage } from '../controllers/aiController.js';
import { verifyToken, authorize } from '../middleware/auth.js';

const router = Router();

// Todas las consultas a la IA deben estar autenticadas.
router.use(verifyToken);

router.post('/chat', handleChat);
router.get('/token-usage', authorize('admin'), getAggregatedTokenUsage);

export default router;
