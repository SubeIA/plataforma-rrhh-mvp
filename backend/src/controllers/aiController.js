import { askChatbot } from '../services/aiService.js';
import { db } from '../config/firebase-config.js';

export const handleChat = async (req, res, next) => {
    try {
        const userId = req.user.uid; // Asignado por el middleware de autenticación
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'El cuerpo de la petición debe incluir "message".' });
        }

        const reply = await askChatbot(userId, message);

        res.json({ reply });
    } catch (error) {
        next(error);
    }
};

export const getAggregatedTokenUsage = async (req, res, next) => {
    try {
        const snapshot = await db.collection('ai_token_usage').get();
        const usageData = [];

        snapshot.forEach(doc => {
            usageData.push({ id: doc.id, ...doc.data() });
        });

        // Agrupar por user_id
        const userUsage = {};
        let totalPromptTokens = 0;
        let totalCompletionTokens = 0;

        for (const record of usageData) {
            const uid = record.user_id;
            const pt = record.prompt_tokens || 0;
            const ct = record.completion_tokens || 0;

            totalPromptTokens += pt;
            totalCompletionTokens += ct;

            if (!userUsage[uid]) {
                userUsage[uid] = { promptTokens: 0, completionTokens: 0, models: new Set() };
            }
            userUsage[uid].promptTokens += pt;
            userUsage[uid].completionTokens += ct;
            userUsage[uid].models.add(record.model_name);
        }

        // Obtener nombres de usuarios
        const userRefs = Object.keys(userUsage).map(uid => db.collection('users').doc(uid));
        const userDocs = userRefs.length > 0 ? await db.getAll(...userRefs) : [];
        const userMap = {};
        userDocs.forEach(doc => {
            if (doc.exists) {
                userMap[doc.id] = doc.data().name || doc.data().email || doc.id;
            }
        });

        const detail = Object.entries(userUsage).map(([uid, stats]) => ({
            userId: uid,
            userName: userMap[uid] || uid,
            promptTokens: stats.promptTokens,
            completionTokens: stats.completionTokens,
            totalTokens: stats.promptTokens + stats.completionTokens,
            models: Array.from(stats.models)
        }));

        res.json({
            global: {
                totalPromptTokens,
                totalCompletionTokens,
                totalTokens: totalPromptTokens + totalCompletionTokens
            },
            detail
        });
    } catch (error) {
        next(error);
    }
};
