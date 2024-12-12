// src/types/database.ts

import { Timestamp, DocumentData, SnapshotOptions } from "@firebase/firestore";
import { Todo, User, NotificationSettings } from "./index";

// Firestoreドキュメントをより厳密に
export interface FirestoreDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version?: number; // オプティミスティックロック用
  deleted?: boolean; // ソフトデリート用
}
// FirestoreのユーザードキュメントType
export interface FirestoreUser
  extends Omit<User, "createdAt" | "updatedAt">,
    FirestoreDocument {}

// FirestoreのTodoドキュメントType
export interface FirestoreTodo
  extends Omit<Todo, "createdAt" | "updatedAt" | "dueDate" | "completedAt">,
    FirestoreDocument {
  dueDate: Timestamp;
  completedAt?: Timestamp;
}

// Firestore通知設定ドキュメントType
export interface FirestoreNotificationSettings
  extends Omit<NotificationSettings, "userId">,
    FirestoreDocument {
  userId: string;
}

// データ変換ユーティリティ型
export interface FirestoreConverters<T> {
  toFirestore: (data: T) => Omit<FirestoreDocument, "id"> & {
    [K in keyof T]: T[K] extends Date
      ? Timestamp
      : T[K] extends Date | null
      ? Timestamp | null
      : T[K] extends Date | undefined
      ? Timestamp | undefined
      : T[K];
  };
  fromFirestore: (data: FirestoreDocument & Record<string, unknown>) => T;
}

// バッチ処理の結果型
export interface BatchOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Error[];
}
