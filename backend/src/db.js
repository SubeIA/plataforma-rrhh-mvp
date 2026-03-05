import { db as firestore } from './config/firebase-config.js';

// Dummy methods to avoid crashing existing code that requires 'initializeTables' or 'close'
// as Firestore doesn't need them in the same way.
async function initializeTables() {
    console.log('✅ Firestore is schema-less. No tables to initialize.');
}

async function close() {
    console.log('✅ Firestore connection closed (or left open by Admin SDK).');
}

/**
 * Log an audit event for data modifications.
 */
async function audit(userId, action, tableName, recordId, details = null) {
    try {
        await firestore.collection('audit_log').add({
            userId,
            action,
            tableName,
            recordId,
            details: details ? JSON.stringify(details) : null,
            timestamp: new Date()
        });
    } catch (err) {
        console.error('Audit log error:', err);
    }
}

// Temporary exports for compatibility during the transition
export default {
    initializeTables,
    close,
    audit,
    firestore // Expose the raw firestore instance for the new specific controllers
};
