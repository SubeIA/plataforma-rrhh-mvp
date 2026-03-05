import { onRequest } from 'firebase-functions/v2/https';
import app from './app.js';
import config from './config/env.js';
import { db } from './config/firebase-config.js';

// Ya no necesitamos app.listen() pues Firebase gestiona el puerto e infraestructura.
// Firebase v2 recomienda el uso de onRequest({ cors: true })

/**
 * Cloud Function Entry Point
 * Exponemos la app Express completa bajo "api"
 */
export const api = onRequest(
    {
        cors: config.corsOrigins,
        region: 'us-central1'
    },
    app
);

console.log(`🚀 Función 'api' inicializada.`);
console.log(`🌍 Environment: ${config.isProduction ? 'production' : 'development'}`);
