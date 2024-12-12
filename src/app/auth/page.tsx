// src/app/auth/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { SignInButton } from "@/components/auth/SignInButton";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return <Loading fullScreen size="lg" text="読み込み中..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader
          title={
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Smart Todo</h1>
              <p className="mt-2 text-gray-600">
                Googleアカウントでサインインして、
                <br />
                スマートなタスク管理を始めましょう
              </p>
            </div>
          }
        />
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-center">
              <SignInButton size="lg" fullWidth />
            </div>
            <div className="text-center text-sm text-gray-500">
              <p>サインインすることで、以下の機能が利用できます：</p>
              <ul className="mt-2 space-y-1">
                <li>• タスクの作成と管理</li>
                <li>• Googleカレンダーとの自動連携</li>
                <li>• スマートな期限管理</li>
                <li>• リマインダー通知</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
