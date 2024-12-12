// src/components/todo/TodoList.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { Todo, TodoCategory } from "@/types";
import { useAuth } from "@/components/auth/AuthContext";
import { todoDb } from "@/lib/db";
import { TodoItem } from "./TodoItem";
import { Loader2, AlertCircle } from "lucide-react";

interface TodoListProps {
  todos: Todo[];
  onUpdate: () => Promise<void>;
  onDelete: () => Promise<void>;
  category?: TodoCategory;
  showCompleted?: boolean;
}

export function TodoList({ 
  todos: initialTodos, 
  // onUpdate, 
  // onDelete, 
  category, 
  showCompleted = false 
}: TodoListProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  // Todoの取得
  const fetchTodos = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const fetchedTodos = await todoDb.listByUser(user.id, category);
      setTodos(fetchedTodos);
      setError(null);
    } catch (err) {
      setError("Todoの取得に失敗しました");
      console.error("Failed to fetch todos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [user, category]);

  // フィルタリングとソート
  const filteredAndSortedTodos = useMemo(() => {
    return todos
      .filter((todo) => (showCompleted ? true : !todo.completed))
      .sort((a, b) => {
        // 未完了を優先
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // 緊急タスクを優先
        if (a.category === "urgent" && b.category !== "urgent") return -1;
        if (b.category === "urgent" && a.category !== "urgent") return 1;
        // 期限でソート
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [todos, showCompleted]);

  // 空の状態の表示
  const renderEmptyState = () => (
    <div className="text-center py-8">
      <div className="flex justify-center mb-4">
        {category === "urgent" ? (
          <AlertCircle className="w-12 h-12 text-yellow-500" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-xl">📝</span>
          </div>
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        {category
          ? `${getCategoryLabel(category)}のタスクはありません`
          : "タスクはありません"}
      </h3>
      <p className="text-gray-500">新しいタスクを追加して始めましょう</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (filteredAndSortedTodos.length === 0) {
    return renderEmptyState();
  }

  return (
    <div className="space-y-4">
      {filteredAndSortedTodos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onUpdate={fetchTodos}
          onDelete={fetchTodos}
        />
      ))}
    </div>
  );
}

// カテゴリーのラベル取得
function getCategoryLabel(category: TodoCategory): string {
  switch (category) {
    case "urgent":
      return "緊急";
    case "today":
      return "今日";
    case "tomorrow":
      return "明日";
    case "thisWeek":
      return "今週";
    case "thisMonth":
      return "今月";
    case "halfYear":
      return "半年以内";
    default:
      return "その他";
  }
}
