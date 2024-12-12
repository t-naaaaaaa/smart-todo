// src/components/auth/AuthGuard.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { Loading } from "@/components/ui/Loading";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      router.push("/auth");
    }
    if (!loading && !requireAuth && user) {
      router.push("/dashboard");
    }
  }, [loading, requireAuth, user, router]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">
          <p>エラーが発生しました</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // 認証が必要なページで未認証の場合、または
  // 認証不要なページで認証済みの場合はnullを返す
  if ((requireAuth && !user) || (!requireAuth && user)) {
    return null;
  }

  return <>{children}</>;
}
