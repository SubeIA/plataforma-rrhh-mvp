/**
 * Script de migración one-shot: agrega companyId a todos los documentos existentes.
 * 
 * INSTRUCCIONES:
 * 1. Crea la empresa piloto primero con POST /api/companies
 * 2. Copia el companyId que te devuelve
 * 3. Pégalo en la variable COMPANY_ID abajo
 * 4. Ejecuta: node scripts/migrate-company.js
 * 5. Borra este script después de ejecutarlo
 */

import { db } from '../src/config/firebase-config.js';

const COMPANY_ID = 'REEMPLAZA_CON_EL_COMPANY_ID'; // ← pega aquí el ID de la empresa

const COLLECTIONS_TO_MIGRATE = [
    'users',
    'profiles',
    'requests',
    'daily_attendance',
    'attendance',
    'medical_licenses',
    'itam_assets',
    'karin_reports',
    'documents',
    'shifts',
    'user_shifts',
    'notifications',
    'audit_log',
    'audit_logs',
];

async function migrateCollection(collectionName) {
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
        console.log(`  ⏭  ${collectionName}: vacía, se omite.`);
        return 0;
    }

    // Filtrar solo docs que NO tengan companyId aún
    const docsToUpdate = snapshot.docs.filter(doc => !doc.data().companyId);

    if (docsToUpdate.length === 0) {
        console.log(`  ✅ ${collectionName}: ya migrada (${snapshot.size} docs).`);
        return 0;
    }

    // Firestore batch: máximo 500 ops por batch
    const BATCH_SIZE = 499;
    let updated = 0;

    for (let i = 0; i < docsToUpdate.length; i += BATCH_SIZE) {
        const chunk = docsToUpdate.slice(i, i + BATCH_SIZE);
        const batch = db.batch();
        chunk.forEach(doc => {
            batch.update(doc.ref, { companyId: COMPANY_ID });
        });
        await batch.commit();
        updated += chunk.length;
    }

    console.log(`  ✅ ${collectionName}: ${updated} documentos actualizados.`);
    return updated;
}

async function main() {
    if (COMPANY_ID === 'REEMPLAZA_CON_EL_COMPANY_ID') {
        console.error('❌ ERROR: Debes reemplazar COMPANY_ID con el ID real de la empresa.');
        process.exit(1);
    }

    console.log(`\n🚀 Iniciando migración para empresa: ${COMPANY_ID}\n`);

    let totalUpdated = 0;
    for (const col of COLLECTIONS_TO_MIGRATE) {
        try {
            const count = await migrateCollection(col);
            totalUpdated += count;
        } catch (err) {
            console.warn(`  ⚠️  ${col}: Error - ${err.message}`);
        }
    }

    console.log(`\n✅ Migración completada. Total documentos actualizados: ${totalUpdated}`);
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Error fatal en migración:', err);
    process.exit(1);
});
