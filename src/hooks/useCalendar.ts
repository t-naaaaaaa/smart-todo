// src/hooks/useCalendar.ts
"use client";

import {
  useState,
  // useCallback,
  useEffect
} from "react";
import { Todo } from "@/types";
import { GoogleCalendarService } from "@/lib/googleCalendar";
import { todoDb } from "@/lib/db";

interface UseCalendarProps {
  userId: string;
}

interface UseCalendarReturn {
  syncStatus: "idle" | "syncing" | "error";
  lastSynced: Date | null;
  error: Error | null;
  syncTodo: (todo: Todo) => Promise<boolean>;
  syncAllTodos: () => Promise<void>;
  removeTodoFromCalendar: (todoId: string) => Promise<boolean>;
  isSyncing: boolean;
}

export function useCalendar({ userId }: UseCalendarProps): UseCalendarReturn {
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">(
    "idle"
  );
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // 単一のTodoを同期
  const syncTodo = async (todo: Todo): Promise<boolean> => {
    try {
      setIsSyncing(true);
      setSyncStatus("syncing");

      let success: boolean;
      if (todo.isCalendarSynced) {
        success = await GoogleCalendarService.updateCalendarEvent(todo);
      } else {
        success = await GoogleCalendarService.createCalendarEvent(todo);
      }

      if (success) {
        await todoDb.update(todo.id, { isCalendarSynced: true });
        setLastSynced(new Date());
        setSyncStatus("idle");
      } else {
        throw new Error("Failed to sync with calendar");
      }

      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Calendar sync failed"));
      setSyncStatus("error");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // 全Todosを同期
  const syncAllTodos = async (): Promise<void> => {
    try {
      setIsSyncing(true);
      setSyncStatus("syncing");

      // 未同期のTodosを取得
      const unsyncedTodos = await todoDb.listByUser(userId);
      const filteredTodos = unsyncedTodos.filter(
        (todo) => !todo.isCalendarSynced
      );

      // 一括同期
      const syncPromises = filteredTodos.map(async (todo) => {
        try {
          const success = await GoogleCalendarService.createCalendarEvent(todo);
          if (success) {
            await todoDb.update(todo.id, { isCalendarSynced: true });
          }
          return success;
        } catch (error) {
          console.error(`Failed to sync todo ${todo.id}:`, error);
          return false;
        }
      });

      await Promise.all(syncPromises);
      setLastSynced(new Date());
      setSyncStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Bulk sync failed"));
      setSyncStatus("error");
    } finally {
      setIsSyncing(false);
    }
  };

  // カレンダーからTodoを削除
  const removeTodoFromCalendar = async (todoId: string): Promise<boolean> => {
    try {
      setIsSyncing(true);
      const success = await GoogleCalendarService.deleteCalendarEvent(todoId);

      if (success) {
        await todoDb.update(todoId, { isCalendarSynced: false });
      }

      return success;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to remove from calendar")
      );
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // 定期的な同期チェック
  useEffect(() => {
    const checkSync = async () => {
      try {
        const todos = await todoDb.listByUser(userId);
        const unsyncedTodos = todos.filter((todo) => !todo.isCalendarSynced);

        if (unsyncedTodos.length > 0) {
          // 未同期のTodoが存在する場合、自動同期を実行
          await syncAllTodos();
        }
      } catch (error) {
        console.error("Sync check failed:", error);
      }
    };

    // 1時間ごとに同期チェック
    const interval = setInterval(checkSync, 60 * 60 * 1000);

    // 初回チェック
    checkSync();

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    syncStatus,
    lastSynced,
    error,
    syncTodo,
    syncAllTodos,
    removeTodoFromCalendar,
    isSyncing,
  };
}
