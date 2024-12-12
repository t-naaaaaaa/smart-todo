// src/components/todo/TodoItem.tsx

import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Todo, TodoCategory } from "@/types";
import { todoDb } from "@/lib/db";
import { GoogleCalendarService } from "@/lib/googleCalendar";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Trash,
  Edit2,
  X,
  Save,
} from "lucide-react";

interface TodoItemProps {
  todo: Todo;
  onUpdate?: () => void;
  onDelete?: () => void;
}

export function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editDueDate, setEditDueDate] = useState(
    format(new Date(todo.dueDate), "yyyy-MM-dd'T'HH:mm")
  );
  const [loading, setLoading] = useState(false);

  // カテゴリに応じたスタイルとアイコンを取得
  const getCategoryStyle = (category: TodoCategory) => {
    switch (category) {
      case "urgent":
        return {
          containerClass: "border-red-500 bg-red-50",
          textClass: "text-red-700",
          icon: AlertTriangle,
        };
      case "today":
        return {
          containerClass: "border-yellow-500 bg-yellow-50",
          textClass: "text-yellow-700",
          icon: Clock,
        };
      default:
        return {
          containerClass: "border-gray-200",
          textClass: "text-gray-700",
          icon: Calendar,
        };
    }
  };

  const categoryStyle = getCategoryStyle(todo.category);

  const handleToggleComplete = async () => {
    try {
      setLoading(true);
      await todoDb.update(todo.id, { completed: !todo.completed });
      await GoogleCalendarService.updateCalendarEvent(todo);
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update todo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("このタスクを削除してもよろしいですか？")) return;

    try {
      setLoading(true);
      await todoDb.delete(todo.id);
      await GoogleCalendarService.deleteCalendarEvent(todo.id);
      onDelete?.();
    } catch (error) {
      console.error("Failed to delete todo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      const updatedTodo = {
        ...todo,
        text: editText,
        dueDate: new Date(editDueDate),
      };
      await todoDb.update(todo.id, updatedTodo);
      await GoogleCalendarService.updateCalendarEvent(updatedTodo);
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update todo:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div
        className={`
        p-4 rounded-lg border ${categoryStyle.containerClass}
        transition-colors duration-200
      `}
      >
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full px-2 py-1 rounded border"
          />
          <input
            type="datetime-local"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="w-full px-2 py-1 rounded border"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 rounded hover:bg-gray-100"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleSaveEdit}
              className="p-1 rounded hover:bg-blue-100"
              disabled={loading}
            >
              <Save className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
      p-4 rounded-lg border ${categoryStyle.containerClass}
      transition-colors duration-200
    `}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={handleToggleComplete}
          disabled={loading}
          className={`mt-1 transition-colors duration-200 ${
            todo.completed
              ? "text-green-500"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <CheckCircle className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`
            font-medium break-words
            ${
              todo.completed
                ? "line-through text-gray-500"
                : categoryStyle.textClass
            }
          `}
          >
            {todo.text}
          </p>

          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <categoryStyle.icon className="w-4 h-4" />
            <span>
              {format(new Date(todo.dueDate), "M月d日(E) HH:mm", {
                locale: ja,
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 rounded hover:bg-gray-100"
            disabled={loading}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-100 text-red-500"
            disabled={loading}
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
