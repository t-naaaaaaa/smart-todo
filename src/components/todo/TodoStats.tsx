"use client";

import { useEffect, useState } from "react";
import {
  // Todo,
  TodoStats as TodoStatsType
} from "@/types";
import { todoDb } from "@/lib/db";
import { dateUtils } from "@/utils/date";
// import { Card, CardContent } from "@/components/ui/Card";

// lucide-reactのアイコンを正しくインポート
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  CalendarDays,
  // Calendar,
  ListTodo,
  LucideIcon,
} from "lucide-react";

interface TodoStatsProps {
  userId: string;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

export function TodoStats({ userId }: TodoStatsProps) {
  const [stats, setStats] = useState<TodoStatsType>({
    total: 0,
    completed: 0,
    urgent: 0,
    overdue: 0,
    todayCount: 0,
    thisWeekCount: 0,
    thisMonthCount: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateStats = async () => {
      try {
        const todos = await todoDb.listByUser(userId);
        // const currentDate = new Date();

        const newStats = todos.reduce(
          (acc, todo) => {
            // 合計カウント
            acc.total++;

            // 完了タスク
            if (todo.completed) {
              acc.completed++;
              return acc;
            }

            const dueDate = new Date(todo.dueDate);

            // 期限切れタスク
            if (dateUtils.isOverdue(dueDate)) {
              acc.overdue++;
            }

            // 緊急タスク（2時間以内）
            if (dateUtils.isWithinHours(dueDate, 2)) {
              acc.urgent++;
            }

            // カテゴリ別カウント
            const category = dateUtils.determineCategory(dueDate);
            if (category === "today") acc.todayCount++;
            if (category === "thisWeek") acc.thisWeekCount++;
            if (category === "thisMonth") acc.thisMonthCount++;

            return acc;
          },
          {
            total: 0,
            completed: 0,
            urgent: 0,
            overdue: 0,
            todayCount: 0,
            thisWeekCount: 0,
            thisMonthCount: 0,
          }
        );

        setStats(newStats);
      } catch (error) {
        console.error("Failed to calculate stats:", error);
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, [userId]);

  const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    color,
  }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatCard
        title="合計タスク"
        value={stats.total}
        icon={ListTodo}
        color="text-blue-500"
      />
      <StatCard
        title="完了タスク"
        value={stats.completed}
        icon={CheckCircle2}
        color="text-green-500"
      />
      <StatCard
        title="緊急タスク"
        value={stats.urgent}
        icon={AlertTriangle}
        color="text-yellow-500"
      />
      <StatCard
        title="期限切れ"
        value={stats.overdue}
        icon={Clock}
        color="text-red-500"
      />
      <StatCard
        title="今週のタスク"
        value={stats.thisWeekCount}
        icon={CalendarDays}
        color="text-purple-500"
      />
    </div>
  );
}
