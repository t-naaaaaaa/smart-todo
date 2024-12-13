// src/lib/db/backup.ts (Part 1)

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { ensureFirebaseInitialized } from "../firebase";
import { COLLECTIONS } from "./schema";

// バックアップデータの型定義
interface FirestoreDocument {
  id: string;
  [key: string]: unknown;
}

interface BackupData {
  [key: string]: FirestoreDocument[];
}

interface BackupMetadata {
  id: string;
  userId: string;
  timestamp: Timestamp;
  collections: string[];
  dataCount: {
    [key: string]: number;
  };
  status: "complete" | "partial" | "failed";
  error?: string;
}

interface RestoreMetadata {
  backupId: string;
  restoredAt: Timestamp;
  status: "complete" | "failed";
  error?: string;
}

export class DatabaseBackup {
  private readonly MIGRATION_COLLECTION = "backups";

  private async createBackupMetadata(
    userId: string,
    collections: string[],
    status: BackupMetadata["status"] = "complete",
    error?: string
  ): Promise<BackupMetadata> {
    const { db } = ensureFirebaseInitialized();
    const backupId = `backup_${Date.now()}`;
    const metadata: BackupMetadata = {
      id: backupId,
      userId,
      timestamp: Timestamp.now(),
      collections,
      dataCount: {},
      status,
      error,
    };

    await setDoc(doc(db, COLLECTIONS.BACKUPS, backupId), metadata);
    return metadata;
  }

  async createBackup(userId: string): Promise<BackupMetadata> {
    const { db } = ensureFirebaseInitialized();
    try {
      const collectionsToBackup = [
        COLLECTIONS.TODOS,
        COLLECTIONS.NOTIFICATION_SETTINGS,
        COLLECTIONS.CALENDAR_MAPPINGS,
      ];

      const metadata = await this.createBackupMetadata(
        userId,
        collectionsToBackup,
        "partial"
      );

      const backupData: BackupData = {};
      let totalCount = 0;

      for (const collectionName of collectionsToBackup) {
        const collectionRef = collection(db, collectionName);
        const q = query(collectionRef, where("userId", "==", userId));

        const snapshot = await getDocs(q);
        backupData[collectionName] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        metadata.dataCount[collectionName] = snapshot.size;
        totalCount += snapshot.size;
      }

      const backupRef = doc(db, COLLECTIONS.BACKUPS, metadata.id);
      await setDoc(backupRef, {
        ...metadata,
        data: backupData,
        status: "complete",
        totalCount,
      });

      return metadata;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown backup error";
      throw new Error(`Backup failed: ${errorMessage}`);
    }
  }// src/lib/db/backup.ts (Part 2)

  async restoreFromBackup(backupId: string): Promise<void> {
    const { db } = ensureFirebaseInitialized();
    const backupRef = doc(db, COLLECTIONS.BACKUPS, backupId);
    const backupDoc = await getDoc(backupRef);

    if (!backupDoc.exists()) {
      throw new Error("Backup not found");
    }

    const backup = backupDoc.data() as BackupMetadata & {
      data: BackupData;
    };

    if (backup.status !== "complete") {
      throw new Error("Cannot restore from incomplete backup");
    }

    const batch = writeBatch(db);
    const maxBatchSize = 500;
    let operationCount = 0;
    let currentBatch = batch;

    try {
      for (const collectionName of backup.collections) {
        const data = backup.data[collectionName] || [];

        for (const item of data) {
          const { id, ...itemData } = item;
          const docRef = doc(db, collectionName, id);
          currentBatch.set(docRef, {
            ...itemData,
            restoredAt: Timestamp.now(),
          });

          operationCount++;

          if (operationCount >= maxBatchSize) {
            await currentBatch.commit();
            currentBatch = writeBatch(db);
            operationCount = 0;
          }
        }
      }

      if (operationCount > 0) {
        await currentBatch.commit();
      }

      const restoreMetadata: RestoreMetadata = {
        backupId,
        restoredAt: Timestamp.now(),
        status: "complete",
      };

      await setDoc(
        doc(db, COLLECTIONS.BACKUPS, `${backupId}_restore`),
        restoreMetadata
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown restore error";

      const restoreMetadata: RestoreMetadata = {
        backupId,
        restoredAt: Timestamp.now(),
        status: "failed",
        error: errorMessage,
      };

      await setDoc(
        doc(db, COLLECTIONS.BACKUPS, `${backupId}_restore`),
        restoreMetadata
      );

      throw new Error(`Restore failed: ${errorMessage}`);
    }
  }

  async getBackupHistory(
    userId: string,
    limit_?: number
  ): Promise<BackupMetadata[]> {
    const { db } = ensureFirebaseInitialized();
    const backupsRef = collection(db, COLLECTIONS.BACKUPS);
    const q = query(
      backupsRef,
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(limit_ || 10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as BackupMetadata);
  }

  async cleanupOldBackups(userId: string, keepLast: number = 5): Promise<void> {
    const { db } = ensureFirebaseInitialized();
    const backups = await this.getBackupHistory(userId);
    const backupsToDelete = backups.slice(keepLast);

    const batch = writeBatch(db);
    backupsToDelete.forEach((backup) => {
      batch.delete(doc(db, COLLECTIONS.BACKUPS, backup.id));
    });

    await batch.commit();
  }
}

export const backupService = new DatabaseBackup();