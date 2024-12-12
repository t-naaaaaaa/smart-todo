// src/app/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { useTodos } from "@/hooks/useTodos";
import { TodoForm } from "@/components/todo/TodoForm";
import { TodoList } from "@/components/todo/TodoList";
import { TodoStats } from "@/components/todo/TodoStats";
import { TodoFilter } from "@/components/todo/TodoFilter";
import { Loading } from "@/components/ui/Loading";
import { Error } from "@/components/ui/Error";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { TodoFilter as TodoFilterType, TodoCategory } from "@/types";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    TodoCategory | undefined
  >(undefined);

  const {
    todos,
    filteredTodos,
    loading: todosLoading,
    error,
    filter,
    setFilter,
    refresh,
  } = useTodos({
    userId: user?.id ?? "",
    initialFilter: { category: activeCategory },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  if (authLoading || todosLoading) {
    return <Loading fullScreen size="lg" text="読み込み中..." />;
  }

  if (error) {
    return (
      <Error
        fullScreen
        title="データの読み込みに失敗しました"
        message="再度お試しください"
        retry={refresh}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                {isSidebarOpen ? <X /> : <Menu />}
              </button>
              <h1 className="text-xl font-semibold text-gray-900 ml-2">
                Smart Todo
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {user?.email && (
                <span className="text-sm text-gray-600 hidden sm:block">
                  {user.email}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<LogOut className="w-4 h-4" />}
                onClick={() => router.push("/auth")}
              >
                サインアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* サイドバー */}
          <aside
            className={`
            lg:w-64 flex-shrink-0
            ${isSidebarOpen ? "block" : "hidden lg:block"}
          `}
          >
            <div className="space-y-6">
              <Card>
                <CardHeader title="統計" />
                <CardContent>
                  <TodoStats userId={user?.id ?? ""} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="フィルター" />
                <CardContent>
                  <TodoFilter
                    onFilterChange={(newFilter: TodoFilterType) => {
                      setFilter(newFilter);
                      setActiveCategory(newFilter.category);
                    }}
                    defaultCategory={activeCategory}
                  />
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* メインエリア */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* Todo作成フォーム */}
              <Card>
                <CardHeader title="新しいタスク" />
                <CardContent>
                  <TodoForm onSuccess={refresh} />
                </CardContent>
              </Card>

              {/* Todoリスト */}
              <Card>
                <CardHeader
                  title={
                    activeCategory
                      ? `${getCategoryLabel(activeCategory)}のタスク`
                      : "すべてのタスク"
                  }
                  action={
                    <span className="text-sm text-gray-500">
                      {filteredTodos.length} 件
                    </span>
                  }
                />
                <CardContent>
                  <TodoList
                    todos={filteredTodos}
                    onUpdate={refresh}
                    onDelete={refresh}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getCategoryLabel(category: TodoCategory): string {
  const labels: Record<TodoCategory, string> = {
    urgent: "緊急",
    today: "今日",
    tomorrow: "明日",
    thisWeek: "今週",
    thisMonth: "今月",
    halfYear: "半年以内",
    none: "その他",
  };
  return labels[category];
}