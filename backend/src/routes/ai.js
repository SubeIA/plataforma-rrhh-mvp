import { Router } from 'express';
import { handleChat, getAggregatedTokenUsage } from '../controllers/aiController.js';
import { verifyToken, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = Router();

// Todas las consultas a la IA deben estar autenticadas.
router.use(verifyToken);

router.post('/chat', handleChat);
router.get('/token-usage', verifyToken, requirePermission(PERMISSIONS.VIEW_ANALYTICS), getAggregatedTokenUsage);

export default router;
