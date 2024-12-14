"use client"; // クライアントコンポーネントとして実行

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { useTodos } from "@/hooks/useTodos";
import { TodoForm } from "@/components/todo/TodoForm";
import { TodoList } from "@/components/todo/TodoList";
import { TodoStats } from "@/components/todo/TodoStats";
import { TodoFilter } from "@/components/todo/TodoFilter";
import { Loading } from "@/components/ui/Loading";
// `Error`コンポーネントと`new Error()`を区別するため、別名でインポート
import { Error as ErrorUI } from "@/components/ui/Error";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { TodoFilter as TodoFilterType, TodoCategory } from "@/types";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getFirebaseServices } from "@/lib/firebase";

export default function DashboardPage() {
  const { user, loading: authLoading, isInitialized } = useAuth();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    TodoCategory | undefined
  >(undefined);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const {
    filteredTodos,
    loading: todosLoading,
    error,
    setFilter,
    refresh,
  } = useTodos({
    userId: user?.id ?? "",
    initialFilter: { category: activeCategory },
  });

  useEffect(() => {
    if (isInitialized && !authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, isInitialized, router]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const { auth } = getFirebaseServices();
      if (!auth) throw new globalThis.Error("Authが初期化されていません");
      await auth.signOut();
      router.push("/auth");
    } catch (err) {
      console.error("サインアウトに失敗しました:", err);
      setIsSigningOut(false);
    }
  };

  if (!isInitialized || authLoading) {
    return <Loading fullScreen size="lg" text="認証情報を確認中..." />;
  }

  if (!user) {
    return <Loading fullScreen size="lg" text="認証ページに移動中..." />;
  }

  if (todosLoading) {
    return <Loading fullScreen size="lg" text="データを読み込み中..." />;
  }

  if (error) {
    return (
      <ErrorUI
        fullScreen
        title="データの読み込みに失敗しました"
        message="再度お試しください"
        retry={refresh}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                aria-label={
                  isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"
                }
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
                onClick={handleSignOut}
                disabled={isSigningOut}
                isLoading={isSigningOut}
                loadingText="サインアウト中..."
              >
                サインアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
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
                  <TodoStats userId={user.id} />
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

          <div className="flex-1">
            <div className="space-y-6">
              <Card>
                <CardHeader title="新しいタスク" />
                <CardContent>
                  <TodoForm onSuccess={refresh} />
                </CardContent>
              </Card>

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
