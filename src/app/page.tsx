"use client"; // クライアントコンポーネントで実行
// コード行ごとにコメントを記載します。

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { Loading } from "@/components/ui/Loading";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/auth");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <Loading fullScreen size="lg" text="読み込み中..." />;
  }

  return null;
}
