// src/utils/validation.ts

import { Todo, Priority, TodoCategory } from "@/types";
import { VALIDATION_RULES } from "@/lib/db/schema";

export const validationUtils = {
  // Todoのバリデーション
  validateTodo(todo: Partial<Todo>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // テキストの検証
    if (!todo.text) {
      errors.push("タスク名は必須です");
    } else if (todo.text.length > VALIDATION_RULES.TODO.TEXT_MAX_LENGTH) {
      errors.push(
        `タスク名は${VALIDATION_RULES.TODO.TEXT_MAX_LENGTH}文字以内で入力してください`
      );
    }

    // 説明文の検証
    if (
      todo.description &&
      todo.description.length > VALIDATION_RULES.TODO.DESCRIPTION_MAX_LENGTH
    ) {
      errors.push(
        `説明は${VALIDATION_RULES.TODO.DESCRIPTION_MAX_LENGTH}文字以内で入力してください`
      );
    }

    // 期限の検証
    if (!todo.dueDate) {
      errors.push("期限は必須です");
    } else if (!(todo.dueDate instanceof Date)) {
      errors.push("期限の形式が正しくありません");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // メールアドレスの検証
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // 日付の検証
  validateDate(date: Date): { isValid: boolean; error?: string } {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return { isValid: false, error: "無効な日付形式です" };
    }

    const now = new Date();
    const hundredYearsFromNow = new Date();
    hundredYearsFromNow.setFullYear(now.getFullYear() + 100);

    if (date < now) {
      return { isValid: false, error: "過去の日付は設定できません" };
    }

    if (date > hundredYearsFromNow) {
      return { isValid: false, error: "期限が遠すぎます" };
    }

    return { isValid: true };
  },

  // 優先度の検証
  validatePriority(priority: string): priority is Priority {
    const validPriorities: Priority[] = ["low", "medium", "high", "urgent"];
    return validPriorities.includes(priority as Priority);
  },

  // カテゴリの検証
  validateCategory(category: string): category is TodoCategory {
    const validCategories: TodoCategory[] = [
      "urgent",
      "today",
      "tomorrow",
      "thisWeek",
      "thisMonth",
      "halfYear",
      "none",
    ];
    return validCategories.includes(category as TodoCategory);
  },

  // 検索クエリの検証とサニタイズ
  sanitizeSearchQuery(query: string): string {
    return query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // 特殊文字を除去
      .replace(/\s+/g, " "); // 連続する空白を1つに
  },

  // オブジェクトの必須フィールド検証
  validateRequiredFields<T extends object>(
    data: Partial<T>,
    requiredFields: (keyof T)[]
  ): { isValid: boolean; missingFields: string[] } {
    const missingFields = requiredFields.filter(
      (field) => !data[field] && data[field] !== 0 && data[field] !== false
    );

    return {
      isValid: missingFields.length === 0,
      missingFields: missingFields as string[],
    };
  },

  // 文字列の長さ検証
  validateLength(
    text: string,
    { min, max }: { min?: number; max?: number }
  ): { isValid: boolean; error?: string } {
    if (min && text.length < min) {
      return { isValid: false, error: `${min}文字以上で入力してください` };
    }
    if (max && text.length > max) {
      return { isValid: false, error: `${max}文字以内で入力してください` };
    }
    return { isValid: true };
  },

  // エラーメッセージの生成
  formatValidationError(error: string | string[]): string {
    if (Array.isArray(error)) {
      return error.join("\n");
    }
    return error;
  },
};
