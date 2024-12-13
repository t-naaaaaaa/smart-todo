"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { ensureFirebaseInitialized } from "@/lib/firebase";
import { userDb } from "@/lib/db";
import { User } from "@/types";

// AuthContextの型定義
interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
  isInitialized: boolean;
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
    // クライアントサイドでのみ実行
    if (typeof window === "undefined") return;

    let unsubscribe: () => void;

    const initializeAuth = async () => {
      try {
        const { auth } = ensureFirebaseInitialized();
        
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          setFirebaseUser(firebaseUser);
          setLoading(true);

          try {
            if (firebaseUser) {
              // Firebase認証ユーザーからアプリユーザーを作成/更新
              const appUser: Omit<User, "createdAt" | "updatedAt"> = {
                id: firebaseUser.uid,
                email: firebaseUser.email ?? "",
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
              };

              // データベースにユーザー情報を保存/更新
              await userDb.createOrUpdate(appUser);
              
              // 最新のユーザー情報を取得
              const fullUser = await userDb.get(firebaseUser.uid);
              if (!fullUser) {
                throw new Error("ユーザー情報の取得に失敗しました");
              }
              
              setUser(fullUser);
            } else {
              // ユーザーがログアウトした場合
              setUser(null);
            }
          } catch (err) {
            console.error("Authentication error:", err);
            setError(err instanceof Error ? err : new Error("認証エラーが発生しました"));
          } finally {
            setLoading(false);
          }
        });

        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize Firebase:", err);
        setError(err instanceof Error ? err : new Error("Firebaseの初期化に失敗しました"));
        setLoading(false);
      }
    };

    initializeAuth();

    // クリーンアップ関数
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // コンテキストの値
  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    error,
    isInitialized,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
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