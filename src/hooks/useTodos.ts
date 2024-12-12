// src/hooks/useTodos.ts

import { useState, useCallback, useEffect } from "react";
import { Todo, TodoFilter } from "@/types";
import { todoDb } from "@/lib/db";
import { GoogleCalendarService } from "@/lib/googleCalendar";

interface UseTodosProps {
  userId: string;
  initialFilter?: TodoFilter;
}

interface UseTodosReturn {
  todos: Todo[];
  filteredTodos: Todo[];
  loading: boolean;
  error: Error | null;
  filter: TodoFilter;
  setFilter: (filter: TodoFilter) => void;
  createTodo: (
    todo: Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateTodo: (todoId: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (todoId: string) => Promise<void>;
  toggleComplete: (todoId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTodos({
  userId,
  initialFilter = {},
}: UseTodosProps): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<TodoFilter>(initialFilter);

  // Todoの取得
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedTodos = await todoDb.listByUser(userId);
      setTodos(fetchedTodos);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch todos"));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 初回読み込み
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // フィルタリング
  const filteredTodos = useCallback(() => {
    return todos.filter((todo) => {
      // カテゴリーフィルター
      if (filter.category && todo.category !== filter.category) {
        return false;
      }

      // 優先度フィルター
      if (filter.priority && todo.priority !== filter.priority) {
        return false;
      }

      // 完了状態フィルター
      if (
        filter.completed !== undefined &&
        todo.completed !== filter.completed
      ) {
        return false;
      }

      // 検索フィルター
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return (
          todo.text.toLowerCase().includes(searchLower) ||
          todo.description?.toLowerCase().includes(searchLower)
        );
      }

      // 日付範囲フィルター
      if (filter.dateRange) {
        const todoDate = new Date(todo.dueDate);
        if (
          todoDate < filter.dateRange.start ||
          todoDate > filter.dateRange.end
        ) {
          return false;
        }
      }

      return true;
    });
  }, [todos, filter]);

  // Todo作成
  const createTodo = async (
    todo: Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    try {
      const newTodo = await todoDb.create(userId, todo);
      await GoogleCalendarService.createCalendarEvent(newTodo);
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create todo"));
      throw err;
    }
  };

  // Todo更新
  const updateTodo = async (todoId: string, updates: Partial<Todo>) => {
    try {
      await todoDb.update(todoId, updates);
      const updatedTodo = await todoDb.get(todoId);
      if (updatedTodo) {
        await GoogleCalendarService.updateCalendarEvent(updatedTodo);
      }
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update todo"));
      throw err;
    }
  };

  // Todo削除
  const deleteTodo = async (todoId: string) => {
    try {
      await todoDb.delete(todoId);
      await GoogleCalendarService.deleteCalendarEvent(todoId);
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to delete todo"));
      throw err;
    }
  };

  // 完了状態の切り替え
  const toggleComplete = async (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;

    try {
      await updateTodo(todoId, {
        completed: !todo.completed,
        completedAt: !todo.completed ? new Date() : undefined,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to toggle todo completion")
      );
      throw err;
    }
  };

  return {
    todos,
    filteredTodos: filteredTodos(),
    loading,
    error,
    filter,
    setFilter,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    refresh: fetchTodos,
  };
}
