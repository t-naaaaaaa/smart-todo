// src/lib/db/schema.ts

import { CollectionReference, collection } from "firebase/firestore";
import { db } from "../firebase";
import {
  FirestoreUser,
  FirestoreTodo,
  FirestoreNotificationSettings,
} from "@/types/database";

// コレクション名の定義
export const COLLECTIONS = {
  USERS: "users",
  TODOS: "todos",
  NOTIFICATION_SETTINGS: "notification_settings",
  CALENDAR_MAPPINGS: "calendar_mappings",
  BACKUPS: "backups",
} as const;

// インデックス定義
export const INDEXES = {
  TODOS: {
    BY_USER: ["userId", "dueDate"],
    BY_STATUS: ["userId", "completed", "dueDate"],
    BY_CATEGORY: ["userId", "category", "dueDate"],
    BY_PRIORITY: ["userId", "priority", "dueDate"],
  },
  CALENDAR_MAPPINGS: {
    BY_USER: ["userId", "lastSynced"],
  },
} as const;

// バリデーションルール
export const VALIDATION_RULES = {
  TODO: {
    TEXT_MAX_LENGTH: 1000,
    DESCRIPTION_MAX_LENGTH: 5000,
  },
  USER: {
    EMAIL_PATTERN: /^[^@]+@[^@]+\.[^@]+$/,
  },
} as const;

// 各コレクションの型安全な参照を取得する関数
export function getCollection<T>(name: string): CollectionReference<T> {
  return collection(db, name) as CollectionReference<T>;
}

// コレクション参照のエクスポート
export const collections = {
  users: () => getCollection<FirestoreUser>(COLLECTIONS.USERS),
  todos: () => getCollection<FirestoreTodo>(COLLECTIONS.TODOS),
  notificationSettings: () =>
    getCollection<FirestoreNotificationSettings>(
      COLLECTIONS.NOTIFICATION_SETTINGS
    ),
  calendarMappings: () =>
    getCollection<FirestoreNotificationSettings>(COLLECTIONS.CALENDAR_MAPPINGS),
  backups: () => getCollection(COLLECTIONS.BACKUPS),
};

// デフォルト値の定義
export const DEFAULTS = {
  NOTIFICATION_SETTINGS: {
    enableEmailNotifications: true,
    enablePushNotifications: true,
    reminderTiming: 30, // minutes
    urgentTaskNotification: true,
    overdueTaskNotification: true,
  },
  TODO: {
    priority: "medium" as const,
    category: "none" as const,
    isCalendarSynced: false,
  },
} as const;

// セキュリティルール用の定数
export const SECURITY_RULES = {
  MAX_TODOS_PER_USER: 1000,
  MAX_BATCH_OPERATIONS: 500,
  RATE_LIMIT: {
    WRITES_PER_MINUTE: 60,
    READS_PER_MINUTE: 180,
  },
} as const;
