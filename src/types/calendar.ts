// src/types/calendar.ts

// Google Calendar Event の基本型
export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: {
      method: "email" | "popup";
      minutes: number;
    }[];
  };
  status?: "confirmed" | "tentative" | "cancelled";
}

// カレンダー同期状態の型
export interface CalendarSyncState {
  todoId: string;
  eventId: string;
  lastSynced: Date;
  syncStatus: "synced" | "pending" | "failed";
  errorMessage?: string;
}

// カレンダーAPI応答の型
export interface CalendarAPIResponse {
  success: boolean;
  data?: GoogleCalendarEvent;
  error?: {
    code: string;
    message: string;
  };
}

// カレンダー権限スコープ
export const CALENDAR_SCOPES = {
  READ: "https://www.googleapis.com/auth/calendar.readonly",
  WRITE: "https://www.googleapis.com/auth/calendar.events",
  SETTINGS: "https://www.googleapis.com/auth/calendar.settings.readonly",
} as const;

// カレンダー設定の型
export interface CalendarSettings {
  defaultReminders: {
    minutes: number;
    method: "email" | "popup";
  }[];
  defaultCalendarId?: string;
  syncEnabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
}

// 同期エラーの型
export interface SyncError {
  code: string;
  message: string;
  timestamp: Date;
  todoId: string;
  retryCount: number;
}

// カレンダーイベントの繰り返し設定
export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  endDate?: Date;
  count?: number;
}