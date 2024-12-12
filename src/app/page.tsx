// src/app/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { Loading } from "@/components/ui/Loading";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // 認証状態に応じてリダイレクト
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/auth");
      }
    }
  }, [user, loading, router]);

  // ローディング中は読み込み表示
  if (loading) {
    return <Loading fullScreen size="lg" text="読み込み中..." />;
  }

  // リダイレクト中は何も表示しない
  return null;
}
