"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { ensureFirebaseInitialized } from "@/lib/firebase";
import { userDb } from "@/lib/db";
import { User } from "@/types";

// AuthContextの型定義
interface AuthContextType {
  user: User | null; // アプリユーザー
  firebaseUser: FirebaseUser | null; // Firebase認証ユーザー
  loading: boolean; // 認証情報のロード中フラグ
  error: Error | null; // 発生したエラー情報
  isInitialized: boolean; // Firebaseの初期化完了フラグ
}

// デフォルト値を持つAuthContextの作成
const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
  isInitialized: false,
});

// AuthProviderコンポーネントのprops型
interface AuthProviderProps {
  children: React.ReactNode;
}

// AuthProviderコンポーネント
export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};

    const initializeAuth = async () => {
      if (typeof window === "undefined") return;

      try {
        const { auth } = await ensureFirebaseInitialized();
        setIsInitialized(true);

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          setFirebaseUser(firebaseUser);
          setLoading(true);

          try {
            if (firebaseUser) {
              const appUser: Omit<User, "createdAt" | "updatedAt"> = {
                id: firebaseUser.uid,
                email: firebaseUser.email ?? "",
                displayName: firebaseUser.displayName ?? "Unknown User",
                photoURL: firebaseUser.photoURL ?? "",
              };

              await userDb.createOrUpdate(appUser);
              const fullUser = await userDb.get(firebaseUser.uid);
              if (!fullUser) {
                throw new Error("ユーザー情報の取得に失敗しました");
              }

              setUser(fullUser);
            } else {
              setUser(null);
            }
          } catch (err) {
            console.error("Authentication error:", err);
            setError(
              err instanceof Error ? err : new Error("認証エラーが発生しました")
            );
          } finally {
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Failed to initialize Firebase:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Firebaseの初期化に失敗しました")
        );
        setLoading(false);
      }
    };

    initializeAuth();
    return () => unsubscribe();
  }, []);

  // コンテキストの値
  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    error,
    isInitialized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 認証情報を使用するためのカスタムフック
 * @throws {Error} AuthProviderの外で使用された場合
 * @returns {AuthContextType} 認証コンテキストの値
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// AuthContextをエクスポート（テスト用）
export { AuthContext };
