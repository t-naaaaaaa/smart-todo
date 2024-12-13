"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { userDb } from "@/lib/db";
import { User } from "@/types";

// AuthContextの型定義
interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
}

// デフォルト値を持つAuthContextの作成
const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
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

  useEffect(() => {
    // Firebase認証の状態変更を監視
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
        // エラーハンドリング
        console.error("Authentication error:", err);
        setError(
          err instanceof Error ? err : new Error("認証エラーが発生しました")
        );
      } finally {
        setLoading(false);
      }
    });

    // クリーンアップ関数：認証状態の監視を解除
    return () => {
      unsubscribe();
    };
  }, []);

  // コンテキストの値
  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    error,
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