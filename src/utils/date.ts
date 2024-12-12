// src/utils/date.ts

import { TodoCategory } from "@/types";

export const dateUtils = {
  // 日時のフォーマット
  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  },

  // 相対的な時間表示（〇分前、など）
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "今";
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 30) return `${days}日前`;
    return this.formatDateTime(date);
  },

  // カテゴリに基づく期限の判定
  determineCategory(dueDate: Date): TodoCategory {
    const now = new Date();
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 2) return "urgent";

    const today = new Date(now.setHours(0, 0, 0, 0));
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const halfYear = new Date(today);
    halfYear.setMonth(halfYear.getMonth() + 6);

    if (dueDate <= tomorrow) return "today";
    if (dueDate <= new Date(tomorrow.setDate(tomorrow.getDate() + 1)))
      return "tomorrow";
    if (dueDate <= nextWeek) return "thisWeek";
    if (dueDate <= nextMonth) return "thisMonth";
    if (dueDate <= halfYear) return "halfYear";
    return "none";
  },

  // 期限切れかどうかの判定
  isOverdue(dueDate: Date): boolean {
    return new Date() > dueDate;
  },

  // 指定時間内かどうかの判定
  isWithinHours(date: Date, hours: number): boolean {
    const now = new Date();
    const diff = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diff >= 0 && diff <= hours;
  },

  // 日付の範囲チェック
  isWithinRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
  },

  // 時間の追加
  addTime(
    date: Date,
    amount: number,
    unit: "minutes" | "hours" | "days"
  ): Date {
    const newDate = new Date(date);
    switch (unit) {
      case "minutes":
        newDate.setMinutes(date.getMinutes() + amount);
        break;
      case "hours":
        newDate.setHours(date.getHours() + amount);
        break;
      case "days":
        newDate.setDate(date.getDate() + amount);
        break;
    }
    return newDate;
  },
};
