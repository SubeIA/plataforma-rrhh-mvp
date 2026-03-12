/**
 * MD-05 FIX: Cloud Function — Notifications TTL Cleanup
 *
 * Deletes notifications older than 30 days automatically.
 * Runs daily at 2:00 AM UTC via Cloud Scheduler (pubsub trigger).
 *
 * Deploy: firebase deploy --only functions:cleanOldNotifications
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

initializeApp();

export const cleanOldNotifications = onSchedule(
    {
        schedule: '0 2 * * *',       // Every day at 02:00 UTC
        timeZone: 'America/Santiago', // Chile timezone
        region: 'us-central1',
    },
    async (event) => {
        const db = getFirestore();
        const thirtyDaysAgo = Timestamp.fromDate(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );

        const snapshot = await db
            .collection('notifications')
            .where('createdAt', '<', thirtyDaysAgo.toDate().toISOString())
            .get();

        if (snapshot.empty) {
            console.log('[cleanOldNotifications] No old notifications to delete.');
            return;
        }

        // Firestore batch supports up to 500 ops per commit
        const BATCH_SIZE = 500;
        let batchCount = 0;

        for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
            const batch = db.batch();
            const chunk = snapshot.docs.slice(i, i + BATCH_SIZE);
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            batchCount++;
        }

        console.log(
            `[cleanOldNotifications] Deleted ${snapshot.docs.length} notifications in ${batchCount} batches.`
        );
    }
);
