"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { userDb } from "@/lib/db";
import { User } from "@/types";
import { getFirebaseServices } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
  isInitialized: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // サーバー側では実行しないガード
    if (typeof window === "undefined") return;

    const { auth } = getFirebaseServices();
    if (!auth) {
      setError(new Error("Authが初期化されていません"));
      setLoading(false);
      setIsInitialized(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentFirebaseUser) => {
        setFirebaseUser(currentFirebaseUser);
        setLoading(true);

        try {
          if (currentFirebaseUser) {
            const appUser = {
              id: currentFirebaseUser.uid,
              email: currentFirebaseUser.email ?? "",
              displayName: currentFirebaseUser.displayName ?? "Unknown User",
              photoURL: currentFirebaseUser.photoURL ?? "",
            };

            await userDb.createOrUpdate(appUser);
            const fullUser = await userDb.get(currentFirebaseUser.uid);
            if (!fullUser) throw new Error("ユーザー情報の取得に失敗しました");

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
          setIsInitialized(true);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, loading, error, isInitialized }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
