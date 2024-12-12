// src/types/index.ts

// ユーザー関連の型定義
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Todoの優先度
export type Priority = "low" | "medium" | "high" | "urgent";

// Todoのカテゴリ
export type TodoCategory =
  | "urgent" // 2時間以内
  | "today" // 今日まで
  | "tomorrow" // 明日まで
  | "thisWeek" // 今週中
  | "thisMonth" // 今月中
  | "halfYear" // 半年以内
  | "none"; // カテゴリなし

// Todoの基本型
export interface Todo {
  id: string;
  userId: string;
  text: string;
  description?: string;
  dueDate: Date;
  category: TodoCategory;
  priority: Priority;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  isCalendarSynced: boolean;
  calendarEventId?: string;
}

// フィルタリング用の型
export interface TodoFilter {
  category?: TodoCategory;
  priority?: Priority;
  completed?: boolean;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// 統計情報の型
export interface TodoStats {
  total: number;
  completed: number;
  urgent: number;
  overdue: number;
  todayCount: number;
  thisWeekCount: number;
  thisMonthCount: number;
}

// 通知設定の型
export interface NotificationSettings {
  userId: string;
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  reminderTiming: number; // minutes before due date
  urgentTaskNotification: boolean;
  overdueTaskNotification: boolean;
}
// APIレスポンスの基本型
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 共通のステータス型
export type Status = 'idle' | 'loading' | 'success' | 'error';

// 検索クエリの型
export interface SearchQuery {
  term: string;
  filters?: TodoFilter;
  page?: number;
  limit?: number;
}