// src/components/auth/AuthContext.tsx

import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { userDb } from "@/lib/db";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      setLoading(true);

      try {
        if (firebaseUser) {
          // Firebase認証ユーザーからアプリユーザーを作成/更新
          const appUser: Omit<User, "createdAt" | "updatedAt"> = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };

          await userDb.createOrUpdate(appUser);
          const fullUser = await userDb.get(firebaseUser.uid);
          setUser(fullUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("認証エラーが発生しました")
        );
      } finally {
        setLoading(false);
      }
    });

    // クリーンアップ関数
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

// カスタムフック
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
