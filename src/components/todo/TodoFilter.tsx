// src/components/todo/TodoFilter.tsx

import { useState, useEffect } from "react";
import { TodoCategory, Priority, TodoFilter } from "@/types";
import {
  Clock,
  CalendarDays,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Search,
  SlidersHorizontal,
} from "lucide-react";

interface TodoFilterProps {
  onFilterChange: (filter: TodoFilter) => void;
  defaultCategory?: TodoCategory;
}

export function TodoFilter({
  onFilterChange,
  defaultCategory,
}: TodoFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<TodoFilter>({
    category: defaultCategory,
    completed: undefined,
    priority: undefined,
    search: "",
  });

  useEffect(() => {
    onFilterChange(filter);
  }, [filter, onFilterChange]);

  const handleSearchChange = (search: string) => {
    setFilter((prev) => ({ ...prev, search }));
  };

  const handleCategoryChange = (category: TodoCategory | undefined) => {
    setFilter((prev) => ({ ...prev, category }));
  };

  const handlePriorityChange = (priority: Priority | undefined) => {
    setFilter((prev) => ({ ...prev, priority }));
  };

  const handleCompletedChange = (completed: boolean | undefined) => {
    setFilter((prev) => ({ ...prev, completed }));
  };

  const handleReset = () => {
    setFilter({
      category: undefined,
      completed: undefined,
      priority: undefined,
      search: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={filter.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="タスクを検索..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* フィルターボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <SlidersHorizontal className="w-5 h-5" />
        フィルター
      </button>

      {/* フィルターパネル */}
      {isOpen && (
        <div className="p-4 border rounded-lg bg-white shadow-lg space-y-4">
          {/* カテゴリーフィルター */}
          <div>
            <h3 className="font-medium mb-2">カテゴリー</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: "urgent",
                  label: "緊急",
                  icon: AlertTriangle,
                  color: "text-red-500",
                },
                {
                  value: "today",
                  label: "今日",
                  icon: Clock,
                  color: "text-yellow-500",
                },
                {
                  value: "tomorrow",
                  label: "明日",
                  icon: CalendarDays,
                  color: "text-green-500",
                },
                {
                  value: "thisWeek",
                  label: "今週",
                  icon: Calendar,
                  color: "text-blue-500",
                },
                {
                  value: "thisMonth",
                  label: "今月",
                  icon: Calendar,
                  color: "text-purple-500",
                },
                {
                  value: "halfYear",
                  label: "半年",
                  icon: Calendar,
                  color: "text-indigo-500",
                },
              ].map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() =>
                    handleCategoryChange(
                      filter.category === (value as TodoCategory)
                        ? undefined
                        : (value as TodoCategory)
                    )
                  }
                  className={`
                    flex items-center gap-2 p-2 rounded-lg border
                    ${
                      filter.category === value
                        ? "bg-blue-50 border-blue-500"
                        : "border-gray-300"
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 優先度フィルター */}
          <div>
            <h3 className="font-medium mb-2">優先度</h3>
            <div className="flex gap-2">
              {[
                { value: "low", label: "低" },
                { value: "medium", label: "中" },
                { value: "high", label: "高" },
                { value: "urgent", label: "緊急" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() =>
                    handlePriorityChange(
                      filter.priority === (value as Priority)
                        ? undefined
                        : (value as Priority)
                    )
                  }
                  className={`
                    px-3 py-1 rounded-lg border
                    ${
                      filter.priority === value
                        ? "bg-blue-50 border-blue-500"
                        : "border-gray-300"
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 完了状態フィルター */}
          <div>
            <h3 className="font-medium mb-2">状態</h3>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleCompletedChange(
                    filter.completed === false ? undefined : false
                  )
                }
                className={`
                  flex items-center gap-2 px-3 py-1 rounded-lg border
                  ${
                    filter.completed === false
                      ? "bg-blue-50 border-blue-500"
                      : "border-gray-300"
                  }
                `}
              >
                <Clock className="w-4 h-4" />
                未完了
              </button>
              <button
                onClick={() =>
                  handleCompletedChange(
                    filter.completed === true ? undefined : true
                  )
                }
                className={`
                  flex items-center gap-2 px-3 py-1 rounded-lg border
                  ${
                    filter.completed === true
                      ? "bg-blue-50 border-blue-500"
                      : "border-gray-300"
                  }
                `}
              >
                <CheckCircle2 className="w-4 h-4" />
                完了済み
              </button>
            </div>
          </div>

          {/* リセットボタン */}
          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              フィルターをリセット
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
