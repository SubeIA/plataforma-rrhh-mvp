import admin from 'firebase-admin';
import config from './env.js';

// Usar Application Default Credentials (ADC) en producción/emulador, o una cuenta de servicio en local
// Para desarrollo local se recomienda inicializar la variable de entorno GOOGLE_APPLICATION_CREDENTIALS 
// apuntando al json descargado desde la consola web.

try {
    // Inicializamos Firebase Admin. 
    // Usa la configuración predeterminada que Firebase provee del entorno. 
    admin.initializeApp();
    console.log('🔥 Conectado a Firebase Admin correctamente.');
} catch (error) {
    // Si ya estaba inicializada ignoramos el error.
    if (!/already exists/.test(error.message)) {
        console.error('🔥 Error inicializando Firebase Admin', error.stack);
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
