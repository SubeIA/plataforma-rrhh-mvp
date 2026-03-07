import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/env.js';
import { db } from '../config/firebase-config.js';

let pinecone = null;
if (config.ai.pineconeApiKey) {
    pinecone = new Pinecone({ apiKey: config.ai.pineconeApiKey });
}

let openai = null;
if (config.ai.openaiApiKey) {
    openai = new OpenAI({ apiKey: config.ai.openaiApiKey });
}

let gemini = null;
if (config.ai.geminiApiKey) {
    gemini = new GoogleGenerativeAI(config.ai.geminiApiKey);
}

/**
 * Registra el uso de tokens en Firestore para la facturación/dashboard
 */
async function saveTokenUsage(userId, promptTokens, completionTokens, modelName) {
    try {
        if (!userId) return;

        await db.collection('ai_token_usage').add({
            user_id: userId,
            prompt_tokens: promptTokens || 0,
            completion_tokens: completionTokens || 0,
            model_name: modelName,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error guardando token usage:', error);
    }
}

/**
 * Obtiene embeddings de texto.
 * Usa OpenAI por defecto, o si no está Gemini no lo soporta directamente con este formato unificado tan simple.
 * Asumiremos que el indexing en Pinecone usa OpenAI embeddings (text-embedding-3-small o text-embedding-ada-002).
 */
async function getEmbedding(text) {
    if (openai) {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text
        });
        return response.data[0].embedding;
    }
    // Si quisieramos usar Gemini para embeddings, habría que instanciar gemini.getGenerativeModel({model: "text-embedding-004"})
    throw new Error('OpenAI API Key no referenciada. Por el momento RAG exige OpenAI param embeddings.');
}

/**
 * Llama a la IA (OpenAI como primario, Gemini como fallback)
 */
async function callLLM(systemPrompt, userPrompt, userId) {
    let errorLog = [];

    // Intento 1: OpenAI
    if (openai) {
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 800
            });
            const text = response.choices[0].message.content;
            const usage = response.usage;

            await saveTokenUsage(userId, usage?.prompt_tokens, usage?.completion_tokens, 'gpt-4o-mini');
            return text;
        } catch (e) {
            console.error('OpenAI Falló:', e.message);
            errorLog.push('OpenAI Error: ' + e.message);
        }
    }

    // Intento 2: Gemini Fallback
    if (gemini) {
        try {
            const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `${systemPrompt}\n\nUser: ${userPrompt}`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Gemini Token counting (Aproximación nativa)
            const promptInfo = await model.countTokens(prompt);
            const textInfo = await model.countTokens(text);

            await saveTokenUsage(userId, promptInfo.totalTokens, textInfo.totalTokens, 'gemini-1.5-flash');
            return text;
        } catch (e) {
            console.error('Gemini Falló:', e.message);
            errorLog.push('Gemini Error: ' + e.message);
        }
    }

    throw new Error(`Ningún LLM disponible pudo responder. Log: ${errorLog.join(' | ')}`);
}

/**
 * Función Principal RAG: askChatbot
 */
export const askChatbot = async (userId, query) => {
    // 1. Obtener Embedding de la pregunta (OpenAI Embeddings)
    let contextText = '';

    if (pinecone && openai) {
        try {
            const queryEmbedding = await getEmbedding(query);
            const index = pinecone.Index(config.ai.pineconeIndexName);

            const queryResponse = await index.query({
                vector: queryEmbedding,
                topK: 5,
                includeMetadata: true
            });

            if (queryResponse.matches && queryResponse.matches.length > 0) {
                contextText = queryResponse.matches.map(m => m.metadata?.text || '').join('\n\n');
            }
        } catch (error) {
            console.error('Error al consultar Pinecone:', error);
            // Fallback: Si no hay base vectorial activa, respondemos sin contexto.
        }
    }

    // 2. Preparar el Prompt
    const systemPrompt = `Eres un asistente inteligente de Recursos Humanos (HXM) para trabajadores y directores en Chile.
Tu objetivo es responder de manera amable, clara y precisa, basándote PRIMORDIALMENTE en el Código del Trabajo y políticas internas provistas en el CONTEXTO.
Si el CONTEXTO proporcionado no contiene la respuesta, puedes basarte en tu conocimiento general de legislación laboral chilena, indicando sutilmente que es una interpretación general.

CONTEXTO CÓDIGO DEL TRABAJO O POLÍTICAS:
${contextText || "[Sin contexto disponible]"}
`;

    // 3. Ejecutar IA
    const llmResponse = await callLLM(systemPrompt, query, userId);
    return llmResponse;
};
