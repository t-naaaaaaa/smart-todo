// src/components/todo/TodoForm.tsx

import { useState, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { todoDb } from "@/lib/db";
import { GoogleCalendarService } from "@/lib/googleCalendar";
import { Priority, TodoCategory } from "@/types";

interface TodoFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function TodoForm({ onSuccess, className = "" }: TodoFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [error, setError] = useState<string | null>(null);

  // カテゴリの自動判定
  const determineCategory = useCallback((dueDate: Date): TodoCategory => {
    const now = new Date();
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 2) return "urgent";

    // 日付の比較用に時刻を0:00に設定
    const today = new Date(now.setHours(0, 0, 0, 0));
    const dueDay = new Date(dueDate.setHours(0, 0, 0, 0));
    const diffDays = Math.ceil(
      (dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "tomorrow";
    if (diffDays <= 7) return "thisWeek";
    if (diffDays <= 30) return "thisMonth";
    if (diffDays <= 180) return "halfYear";
    return "none";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // バリデーション
      if (!text.trim()) {
        throw new Error("タスク名を入力してください");
      }
      if (!dueDate) {
        throw new Error("期限を設定してください");
      }

      const dueDateObj = new Date(dueDate);
      const category = determineCategory(dueDateObj);

      // Todoの作成
      const todo = await todoDb.create(user.id, {
        text: text.trim(),
        description: description.trim(),
        dueDate: dueDateObj,
        category,
        priority,
        completed: false,
        isCalendarSynced: false,
      });

      // Googleカレンダーとの同期
      const calendarSuccess = await GoogleCalendarService.createCalendarEvent(
        todo
      );
      if (calendarSuccess) {
        await todoDb.update(todo.id, { isCalendarSynced: true });
      }

      // フォームのリセット
      setText("");
      setDescription("");
      setDueDate("");
      setPriority("medium");

      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "予期せぬエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="新しいタスクを入力..."
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="詳細な説明（任意）"
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
        />
      </div>

      <div className="flex gap-4">
        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="urgent">緊急</option>
        </select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className={`
          w-full px-4 py-2 rounded-lg font-medium text-white
          bg-blue-500 hover:bg-blue-600 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {loading ? "タスクを作成中..." : "タスクを作成"}
      </button>
    </form>
  );
}
