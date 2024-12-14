"use client";

import {
  Timestamp,
  writeBatch,
  doc,
  query,
  getDocs,
  setDoc,
  getDoc,
  collection,
  FieldValue,
} from "firebase/firestore";
import { getFirebaseServices } from "../firebase";
import { collections } from "./schema";

interface Migration {
  version: number;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

interface MigrationStatus {
  version: number;
  executedAt: Timestamp;
  success: boolean;
  error?: string;
}

export class DatabaseMigration {
  private readonly MIGRATION_COLLECTION = "migrations";

  private readonly migrations: Migration[] = [
    {
      version: 1,
      description: "Initial schema creation",
      up: async () => {
        console.log("Initial schema migration completed");
      },
      down: async () => {
        console.log("Initial schema rollback completed");
      },
    },
    {
      version: 2,
      description: "Add calendar sync fields to todos",
      up: async () => {
        const { db } = getFirebaseServices();
        if (!db) throw new Error("Firestoreが初期化されていません");
        const todosRef = collections.todos();
        const snapshot = await getDocs(query(todosRef));

        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnap) => {
          // ここでisCalendarSynced等は上書き用に使うだけで、変数として使わないので分割代入で受け取らない
          batch.update(docSnap.ref, {
            isCalendarSynced: false,
            calendarEventId: null as unknown as FieldValue,
            updatedAt: Timestamp.now(),
          });
        });

        await batch.commit();
      },
      down: async () => {
        const { db } = getFirebaseServices();
        if (!db) throw new Error("Firestoreが初期化されていません");
        const todosRef = collections.todos();
        const snapshot = await getDocs(query(todosRef));

        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          // 不要なフィールドは取り出さない
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { isCalendarSynced, calendarEventId, ...rest } = data;
          batch.update(docSnap.ref, {
            ...rest,
            updatedAt: Timestamp.now(),
          });
        });

        await batch.commit();
      },
    },
  ];

  private async getCurrentVersion(): Promise<number> {
    const { db } = getFirebaseServices();
    if (!db) throw new Error("Firestoreが初期化されていません");
    const migrationRef = doc(db, this.MIGRATION_COLLECTION, "current");
    const snapshot = await getDoc(migrationRef);
    return snapshot.exists() ? snapshot.data()?.version ?? 0 : 0;
  }

  private async saveMigrationStatus(status: MigrationStatus): Promise<void> {
    const { db } = getFirebaseServices();
    if (!db) throw new Error("Firestoreが初期化されていません");
    const migrationRef = doc(db, this.MIGRATION_COLLECTION, "current");
    await setDoc(migrationRef, status);

    const historyRef = doc(
      collection(db, this.MIGRATION_COLLECTION),
      `v${status.version}_${status.executedAt.toMillis()}`
    );
    await setDoc(historyRef, status);
  }

  async migrate(targetVersion?: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const maxVersion = Math.max(...this.migrations.map((m) => m.version));
    const finalVersion = targetVersion ?? maxVersion;

    console.log(`Current version: ${currentVersion}`);
    console.log(`Target version: ${finalVersion}`);

    try {
      if (currentVersion < finalVersion) {
        for (const migration of this.migrations) {
          if (
            migration.version > currentVersion &&
            migration.version <= finalVersion
          ) {
            console.log(
              `Executing migration ${migration.version}: ${migration.description}`
            );
            await migration.up();
            await this.saveMigrationStatus({
              version: migration.version,
              executedAt: Timestamp.now(),
              success: true,
            });
          }
        }
      } else if (currentVersion > finalVersion) {
        for (const migration of [...this.migrations].reverse()) {
          if (
            migration.version <= currentVersion &&
            migration.version > finalVersion
          ) {
            console.log(
              `Rolling back migration ${migration.version}: ${migration.description}`
            );
            await migration.down();
            await this.saveMigrationStatus({
              version: migration.version - 1,
              executedAt: Timestamp.now(),
              success: true,
            });
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Migration failed:", errorMessage);
      await this.saveMigrationStatus({
        version: currentVersion,
        executedAt: Timestamp.now(),
        success: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  async getMigrationHistory(): Promise<MigrationStatus[]> {
    const { db } = getFirebaseServices();
    if (!db) throw new Error("Firestoreが初期化されていません");
    const migrationsRef = collection(db, this.MIGRATION_COLLECTION);
    const snapshot = await getDocs(query(migrationsRef));
    return snapshot.docs
      .map((docSnap) => docSnap.data() as MigrationStatus)
      .sort((a, b) => b.executedAt.toMillis() - a.executedAt.toMillis());
  }
}

export const migrations = new DatabaseMigration();
