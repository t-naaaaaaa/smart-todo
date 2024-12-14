"use client";

// コード行ごとにコメントを記載します。
import { CollectionReference, collection } from "firebase/firestore";
import { getFirebaseServices } from "../firebase";
import {
  FirestoreUser,
  FirestoreTodo,
  FirestoreNotificationSettings,
} from "@/types/database";

export const COLLECTIONS = {
  USERS: "users",
  TODOS: "todos",
  NOTIFICATION_SETTINGS: "notification_settings",
  CALENDAR_MAPPINGS: "calendar_mappings",
  BACKUPS: "backups",
} as const;

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

export const VALIDATION_RULES = {
  TODO: {
    TEXT_MAX_LENGTH: 1000,
    DESCRIPTION_MAX_LENGTH: 5000,
  },
  USER: {
    EMAIL_PATTERN: /^[^@]+@[^@]+\.[^@]+$/,
  },
} as const;

export function getCollection<T>(name: string): CollectionReference<T> {
  const { db } = getFirebaseServices();
  if (!db) throw new Error("Firestoreが初期化されていません");
  return collection(db, name) as CollectionReference<T>;
}

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

export const DEFAULTS = {
  NOTIFICATION_SETTINGS: {
    enableEmailNotifications: true,
    enablePushNotifications: true,
    reminderTiming: 30,
    urgentTaskNotification: true,
    overdueTaskNotification: true,
  },
  TODO: {
    priority: "medium" as const,
    category: "none" as const,
    isCalendarSynced: false,
  },
} as const;

export const SECURITY_RULES = {
  MAX_TODOS_PER_USER: 1000,
  MAX_BATCH_OPERATIONS: 500,
  RATE_LIMIT: {
    WRITES_PER_MINUTE: 60,
    READS_PER_MINUTE: 180,
  },
} as const;
